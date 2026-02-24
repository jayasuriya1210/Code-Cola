const { generateTTS } = require("../services/tts/tts");
const Audio = require("../models/audioModel");
const History = require("../models/historyModel");
const Case = require("../models/caseModel");

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

    const tts = generateTTS(text, lang);
    const audioURL = tts.audioURL;
    const audioURLs = tts.audioURLs;
    const language = lang || "en";
    const audioId = await Audio.save({
      user_id: req.user.id,
      case_id: caseId,
      summary_id: summary_id ? Number(summary_id) : null,
      language,
      audio_url: audioURL,
    });

    await History.add(req.user.id, caseId, case_title || caseRecord.title || "Untitled case", language);

    return res.json({ audioId, audioURL, audioURLs, language });
  } catch (error) {
    return res.status(500).json({ msg: error.message || "Audio generation failed" });
  }
};
