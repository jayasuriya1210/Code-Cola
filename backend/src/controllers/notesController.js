const { createNotesPDF } = require("../services/notes/notes");
const Notes = require("../models/notesModel");

exports.generateNotes = async (req, res) => {
  try {
    const { text, case_id } = req.body;
    const user_id = req.user.id;
    if (!text || !text.trim()) {
      return res.status(400).json({ msg: "text is required" });
    }

    const pdfPath = createNotesPDF(text);
    const noteId = await Notes.save(user_id, case_id ? Number(case_id) : null, text, pdfPath);

    return res.json({ noteId, pdfPath });
  } catch (error) {
    return res.status(500).json({ msg: "Notes export failed" });
  }
};

exports.getMyNotes = async (req, res) => {
  try {
    const notes = await Notes.listByUser(req.user.id);
    return res.json(notes);
  } catch (error) {
    return res.status(500).json({ msg: "Failed to load notes" });
  }
};
