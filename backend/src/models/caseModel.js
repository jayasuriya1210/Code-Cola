const db = require("../config/db");

const Case = {
  createFromSearch: ({ user_id, title, source_url, pdf_url }) => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO cases (user_id, title, source_url, pdf_url, uploaded_at)
         VALUES (?, ?, ?, ?, datetime('now'))`,
        [user_id, title || null, source_url || null, pdf_url || null],
        function (err) {
          err ? reject(err) : resolve(this.lastID);
        }
      );
    });
  },

  saveUpload: ({ case_id, user_id, file_path, extracted_text, pdf_blob, pdf_mime, pdf_name }) => {
    return new Promise((resolve, reject) => {
      if (case_id) {
        db.run(
          `UPDATE cases
           SET file_path = ?, pdf_blob = ?, pdf_mime = ?, pdf_name = ?, extracted_text = ?, uploaded_at = datetime('now')
           WHERE id = ? AND user_id = ?`,
          [file_path, pdf_blob || null, pdf_mime || "application/pdf", pdf_name || null, extracted_text, case_id, user_id],
          function (err) {
            err ? reject(err) : resolve(case_id);
          }
        );
        return;
      }

      db.run(
        `INSERT INTO cases (user_id, file_path, pdf_blob, pdf_mime, pdf_name, extracted_text, uploaded_at)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
        [user_id, file_path, pdf_blob || null, pdf_mime || "application/pdf", pdf_name || null, extracted_text],
        function (err) {
          err ? reject(err) : resolve(this.lastID);
        }
      );
    });
  },

  findById: (id, user_id) => {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT id, user_id, title, source_url, pdf_url, file_path, extracted_text, uploaded_at
         FROM cases WHERE id = ? AND user_id = ?`,
        [id, user_id],
        (err, row) => (err ? reject(err) : resolve(row))
      );
    });
  },

  getPdfByCaseId: (id, user_id) => {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT id, title, file_path, pdf_blob, pdf_mime, pdf_name
         FROM cases WHERE id = ? AND user_id = ?`,
        [id, user_id],
        (err, row) => (err ? reject(err) : resolve(row))
      );
    });
  },

  listByUser: (user_id) => {
    return new Promise((resolve, reject) => {
      db.all(
        "SELECT * FROM cases WHERE user_id = ? ORDER BY uploaded_at DESC",
        [user_id],
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    });
  },

  getDashboardData: (user_id) => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT
          c.id,
          c.title,
          c.source_url,
          c.pdf_url,
          c.file_path,
          c.uploaded_at,
          s.full_summary,
          a.audio_url,
          a.language,
          n.notes_path,
          h.listened_at
        FROM cases c
        LEFT JOIN summaries s ON s.case_id = c.id AND s.user_id = c.user_id
        LEFT JOIN audio_records a ON a.case_id = c.id AND a.user_id = c.user_id
        LEFT JOIN notes n ON n.case_id = c.id AND n.user_id = c.user_id
        LEFT JOIN history h ON h.case_id = c.id AND h.user_id = c.user_id
        WHERE c.user_id = ?
        GROUP BY c.id
        ORDER BY c.uploaded_at DESC`,
        [user_id],
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    });
  },
};

module.exports = Case;
