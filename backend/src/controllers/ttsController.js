const { generateTTS, getTTSHealth } = require("../services/tts/tts");
const Audio = require("../models/audioModel");
const History = require("../models/historyModel");
const Case = require("../models/caseModel");
const axios = require("axios");

function countWords(text) {
  return String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

exports.textToAudio = async (req, res) => {
  try {
    const { text, lang, case_id, summary_id, case_title, source_url, pdf_url } = req.body;
    const parsedCaseId = Number(case_id);
    if (!text || !text.trim()) {
      return res.status(400).json({ msg: "text is required" });
    }

    let resolvedCaseId = Number.isFinite(parsedCaseId) && parsedCaseId > 0 ? parsedCaseId : null;
    let caseRecord = resolvedCaseId ? await Case.findById(resolvedCaseId, req.user.id) : null;

    if (!caseRecord) {
      resolvedCaseId = await Case.createFromSearch({
        user_id: req.user.id,
        title: case_title || "Untitled case",
        source_url: source_url || null,
        pdf_url: pdf_url || null,
      });
      caseRecord = await Case.findById(resolvedCaseId, req.user.id);
    }

    if (!caseRecord || !resolvedCaseId) {
      return res.status(500).json({ msg: "Unable to resolve case for audio generation" });
    }

    const requestText = String(text || "").trim();
    const extractedText = String(caseRecord?.extracted_text || "").trim();
    const sourceWordCount = countWords(extractedText || requestText);
    const requestWordCount = countWords(requestText);

    // If request text is much shorter than the PDF content, synthesize from extracted PDF text.
    const shouldUseExtracted =
      extractedText &&
      sourceWordCount >= 300 &&
      requestWordCount < Math.max(220, Math.floor(sourceWordCount * 0.35));

    const textForTTS = shouldUseExtracted ? extractedText : requestText;

    const tts = await generateTTS(textForTTS, { sourceWordCount });
    const audioURL = tts.audioURL;
    const audioURLs = tts.audioURLs;
    const ttsProvider = tts.provider || "unknown";
    const language = lang || "en";
    const audioId = await Audio.save({
      user_id: req.user.id,
      case_id: resolvedCaseId,
      summary_id: summary_id ? Number(summary_id) : null,
      language,
      audio_url: audioURL,
      audio_urls: audioURLs,
    });

    await History.add(req.user.id, resolvedCaseId, case_title || caseRecord.title || "Untitled case", language);

    return res.json({ audioId, caseId: resolvedCaseId, audioURL, audioURLs, ttsProvider, language });
  } catch (error) {
    return res.status(500).json({ msg: error.message || "Audio generation failed" });
  }
};

exports.proxyAudio = async (req, res) => {
  try {
    const raw = String(req.query.u || "").trim();
    if (!raw) return res.status(400).json({ msg: "u is required" });

    let url;
    try {
      url = new URL(raw);
    } catch (_error) {
      return res.status(400).json({ msg: "Invalid URL" });
    }

    if (url.protocol !== "https:" || !/\.?google\.com$/i.test(url.hostname)) {
      return res.status(400).json({ msg: "URL is not allowed" });
    }

    const response = await axios.get(url.toString(), {
      responseType: "stream",
      timeout: 12000,
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    res.setHeader("Content-Type", response.headers["content-type"] || "audio/mpeg");
    response.data.pipe(res);
  } catch (_error) {
    return res.status(502).json({ msg: "Failed to stream audio" });
  }
};

exports.health = async (_req, res) => {
  try {
    const health = await getTTSHealth();
    const ok = Boolean(
      (health.piper.enabled && health.piper.ready)
      || health.edge.ready
    );
    return res.status(ok ? 200 : 503).json(health);
  } catch (error) {
    return res.status(500).json({ msg: error.message || "Failed to get TTS health" });
  }
};
