const db = require("../config/db");

const Audio = {
  save: ({ user_id, case_id, summary_id, language, audio_url }) => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO audio_records (user_id, case_id, summary_id, language, audio_url, created_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'))`,
        [user_id, case_id, summary_id || null, language || "en", audio_url],
        function (err) {
          err ? reject(err) : resolve(this.lastID);
        }
      );
    });
  },

  latestByCase: (user_id, case_id) => {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM audio_records
         WHERE user_id = ? AND case_id = ?
         ORDER BY created_at DESC LIMIT 1`,
        [user_id, case_id],
        (err, row) => (err ? reject(err) : resolve(row))
      );
    });
  },
};

module.exports = Audio;
