const History = require("../models/historyModel");

exports.addHistory = async (req, res) => {
  try {
    const { case_id, case_title, language } = req.body;
    const user_id = req.user.id;

    await History.add(user_id, case_id ? Number(case_id) : null, case_title, language);

    return res.json({ msg: "History added" });
  } catch (error) {
    return res.status(500).json({ msg: "Failed to add history" });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const user_id = req.user.id;
    const history = await History.getAll(user_id);
    return res.json(history);
  } catch (error) {
    return res.status(500).json({ msg: "Failed to load history" });
  }
};

exports.deleteCaseAudio = async (req, res) => {
  try {
    const caseId = Number(req.params.caseId);
    if (!caseId) return res.status(400).json({ msg: "Valid caseId is required" });

    await History.deleteAudioByCase(req.user.id, caseId);
    return res.json({ msg: "Audio deleted" });
  } catch (error) {
    return res.status(500).json({ msg: "Failed to delete audio" });
  }
};

exports.deleteCaseRecord = async (req, res) => {
  try {
    const caseId = Number(req.params.caseId);
    if (!caseId) return res.status(400).json({ msg: "Valid caseId is required" });

    await History.deleteCaseWithArtifacts(req.user.id, caseId);
    return res.json({ msg: "Case history deleted" });
  } catch (error) {
    return res.status(500).json({ msg: "Failed to delete case history" });
  }
};

exports.clearAllHistory = async (req, res) => {
  try {
    await History.clearAllWithArtifacts(req.user.id);
    return res.json({ msg: "All history deleted" });
  } catch (error) {
    return res.status(500).json({ msg: "Failed to clear history" });
  }
};
