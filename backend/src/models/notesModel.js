const db = require("../config/db");

const Notes = {
  save: (user_id, case_id, note_text, pdf_path) => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO notes (user_id, case_id, note_text, notes_path, created_at)
         VALUES (?, ?, ?, ?, datetime('now'))`,
        [user_id, case_id || null, note_text, pdf_path],
        function (err) {
          err ? reject(err) : resolve(this.lastID);
        }
      );
    });
  },

  listByUser: (user_id) => {
    return new Promise((resolve, reject) => {
      db.all(
        "SELECT * FROM notes WHERE user_id = ? ORDER BY created_at DESC",
        [user_id],
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    });
  },
};

module.exports = Notes;
