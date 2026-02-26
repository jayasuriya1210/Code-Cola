const fs = require("fs");
const path = require("path");
const db = require("../config/db");

const BACKEND_ROOT = path.resolve(__dirname, "../../");

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) return reject(err);
      return resolve(this.changes || 0);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows || [])));
  });
}

function normalizeFilePath(fileValue) {
  if (!fileValue) return null;
  if (/^https?:\/\//i.test(fileValue)) return null;

  if (fileValue.startsWith("/audio/")) {
    return path.join(BACKEND_ROOT, fileValue.replace(/^\/+/, ""));
  }

  const cleaned = fileValue.replace(/^\.\//, "");
  if (path.isAbsolute(cleaned)) return cleaned;
  return path.join(BACKEND_ROOT, cleaned);
}

async function removeFiles(fileValues) {
  const uniquePaths = [...new Set(fileValues.map(normalizeFilePath).filter(Boolean))];
  await Promise.all(
    uniquePaths.map(async (filePath) => {
      try {
        await fs.promises.unlink(filePath);
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
    })
  );
}

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
        `SELECT
          c.id AS case_id,
          c.title AS case_title,
          c.source_url,
          c.pdf_url,
          c.file_path,
          c.uploaded_at,
          (
            SELECT h.listened_at
            FROM history h
            WHERE h.user_id = c.user_id AND h.case_id = c.id
            ORDER BY h.listened_at DESC, h.id DESC
            LIMIT 1
          ) AS listened_at,
          (
            SELECT ar.audio_url
            FROM audio_records ar
            WHERE ar.user_id = c.user_id AND ar.case_id = c.id
            ORDER BY ar.created_at DESC, ar.id DESC
            LIMIT 1
          ) AS audio_url,
          (
            SELECT ar.audio_urls_json
            FROM audio_records ar
            WHERE ar.user_id = c.user_id AND ar.case_id = c.id
            ORDER BY ar.created_at DESC, ar.id DESC
            LIMIT 1
          ) AS audio_urls_json,
          (
            SELECT ar.id
            FROM audio_records ar
            WHERE ar.user_id = c.user_id AND ar.case_id = c.id
            ORDER BY ar.created_at DESC, ar.id DESC
            LIMIT 1
          ) AS audio_id,
          (
            SELECT ar.created_at
            FROM audio_records ar
            WHERE ar.user_id = c.user_id AND ar.case_id = c.id
            ORDER BY ar.created_at DESC, ar.id DESC
            LIMIT 1
          ) AS audio_created_at,
          (
            SELECT n.notes_path
            FROM notes n
            WHERE n.user_id = c.user_id AND n.case_id = c.id
            ORDER BY n.created_at DESC, n.id DESC
            LIMIT 1
          ) AS notes_path,
          (
            SELECT n.id
            FROM notes n
            WHERE n.user_id = c.user_id AND n.case_id = c.id
            ORDER BY n.created_at DESC, n.id DESC
            LIMIT 1
          ) AS notes_id,
          (
            SELECT n.created_at
            FROM notes n
            WHERE n.user_id = c.user_id AND n.case_id = c.id
            ORDER BY n.created_at DESC, n.id DESC
            LIMIT 1
          ) AS notes_created_at
         FROM cases c
         WHERE c.user_id = ?
         ORDER BY COALESCE(listened_at, c.uploaded_at) DESC, c.id DESC`,
        [user_id],
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    });
  },

  deleteAudioByCase: async (user_id, case_id) => {
    const rows = await all(
      "SELECT audio_url FROM audio_records WHERE user_id = ? AND case_id = ?",
      [user_id, case_id]
    );
    await removeFiles(rows.map((row) => row.audio_url));
    await run("DELETE FROM audio_records WHERE user_id = ? AND case_id = ?", [user_id, case_id]);
  },

  deleteCaseWithArtifacts: async (user_id, case_id) => {
    const audioRows = await all(
      "SELECT audio_url FROM audio_records WHERE user_id = ? AND case_id = ?",
      [user_id, case_id]
    );
    const notesRows = await all(
      "SELECT notes_path FROM notes WHERE user_id = ? AND case_id = ?",
      [user_id, case_id]
    );
    const caseRows = await all("SELECT file_path FROM cases WHERE user_id = ? AND id = ?", [user_id, case_id]);

    await removeFiles([
      ...audioRows.map((row) => row.audio_url),
      ...notesRows.map((row) => row.notes_path),
      ...caseRows.map((row) => row.file_path),
    ]);

    await run("DELETE FROM history WHERE user_id = ? AND case_id = ?", [user_id, case_id]);
    await run("DELETE FROM audio_records WHERE user_id = ? AND case_id = ?", [user_id, case_id]);
    await run("DELETE FROM notes WHERE user_id = ? AND case_id = ?", [user_id, case_id]);
    await run("DELETE FROM summaries WHERE user_id = ? AND case_id = ?", [user_id, case_id]);
    await run("DELETE FROM cases WHERE user_id = ? AND id = ?", [user_id, case_id]);
  },

  clearAllWithArtifacts: async (user_id) => {
    const audioRows = await all("SELECT audio_url FROM audio_records WHERE user_id = ?", [user_id]);
    const notesRows = await all("SELECT notes_path FROM notes WHERE user_id = ?", [user_id]);
    const caseRows = await all("SELECT file_path FROM cases WHERE user_id = ?", [user_id]);

    await removeFiles([
      ...audioRows.map((row) => row.audio_url),
      ...notesRows.map((row) => row.notes_path),
      ...caseRows.map((row) => row.file_path),
    ]);

    await run("DELETE FROM history WHERE user_id = ?", [user_id]);
    await run("DELETE FROM audio_records WHERE user_id = ?", [user_id]);
    await run("DELETE FROM notes WHERE user_id = ?", [user_id]);
    await run("DELETE FROM summaries WHERE user_id = ?", [user_id]);
    await run("DELETE FROM cases WHERE user_id = ?", [user_id]);
  },
};

module.exports = History;
