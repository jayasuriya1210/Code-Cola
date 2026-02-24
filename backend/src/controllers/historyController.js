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
