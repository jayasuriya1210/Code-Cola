const Case = require("../models/caseModel");

exports.listCases = async (req, res) => {
  try {
    const rows = await Case.getDashboardData(req.user.id);
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ msg: "Failed to load cases" });
  }
};

exports.getCase = async (req, res) => {
  try {
    const caseId = Number(req.params.caseId);
    const row = await Case.findById(caseId, req.user.id);
    if (!row) return res.status(404).json({ msg: "Case not found" });
    return res.json(row);
  } catch (error) {
    return res.status(500).json({ msg: "Failed to load case" });
  }
};
