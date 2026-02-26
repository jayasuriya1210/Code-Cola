const { generateTTS, getTTSHealth } = require("../services/tts/tts");
const Audio = require("../models/audioModel");
const History = require("../models/historyModel");
const Case = require("../models/caseModel");
const axios = require("axios");

exports.textToAudio = async (req, res) => {
  try {
    const { text, lang, case_id, summary_id, case_title } = req.body;
    const caseId = Number(case_id);
    if (!text || !text.trim()) {
      return res.status(400).json({ msg: "text is required" });
    }
    if (!caseId) {
      return res.status(400).json({ msg: "case_id is required" });
    }

    const caseRecord = await Case.findById(caseId, req.user.id);
    if (!caseRecord) {
      return res.status(404).json({ msg: "Case not found" });
    }

    const tts = await generateTTS(text, lang);
    const audioURL = tts.audioURL;
    const audioURLs = tts.audioURLs;
    const ttsProvider = tts.provider || "unknown";
    const language = lang || "en";
    const audioId = await Audio.save({
      user_id: req.user.id,
      case_id: caseId,
      summary_id: summary_id ? Number(summary_id) : null,
      language,
      audio_url: audioURL,
      audio_urls: audioURLs,
    });

    await History.add(req.user.id, caseId, case_title || caseRecord.title || "Untitled case", language);

    return res.json({ audioId, audioURL, audioURLs, ttsProvider, language });
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
      (health.indicf5.enabled && health.indicf5.ready)
      || (health.piper.enabled && health.piper.ready)
      || health.edge.ready
    );
    return res.status(ok ? 200 : 503).json(health);
  } catch (error) {
    return res.status(500).json({ msg: error.message || "Failed to get TTS health" });
  }
};
