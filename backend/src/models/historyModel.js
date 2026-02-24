const db = require("../config/db");

const History = {
  add: (user_id, case_id, case_title, language) => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO history (user_id, case_id, case_title, listened_at, language)
         VALUES (?, ?, ?, datetime('now'), ?)`,
        [user_id, case_id || null, case_title || null, language || "en"],
        function (err) {
          err ? reject(err) : resolve(this.lastID);
        }
      );
    });
  },

  getAll: (user_id) => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT h.*, c.title AS case_db_title, c.file_path, c.pdf_url
         FROM history h
         LEFT JOIN cases c ON c.id = h.case_id
         WHERE h.user_id = ?
         ORDER BY h.listened_at DESC`,
        [user_id],
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    });
  },
};

module.exports = History;
