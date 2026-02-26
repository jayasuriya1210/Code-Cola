const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "../../database.db");
let activeDbPath = DB_PATH;

let activeDb = null;
let recoveryInProgress = false;
let recoveredOnce = false;

const db = {
  run: (...args) => activeDb.run(...args),
  get: (...args) => activeDb.get(...args),
  all: (...args) => activeDb.all(...args),
  serialize: (...args) => activeDb.serialize(...args),
  close: (...args) => activeDb.close(...args),
};

function isUnsupportedFormatError(err) {
  return String(err?.message || "").toLowerCase().includes("unsupported file format");
}

function backupCorruptedDb() {
  if (!fs.existsSync(activeDbPath)) return;
  const backupPath = `${activeDbPath}.corrupt.${Date.now()}`;
  fs.renameSync(activeDbPath, backupPath);
  console.error(`Corrupted SQLite DB detected. Backed up to: ${backupPath}`);
}

function openDatabase() {
  activeDb = new sqlite3.Database(activeDbPath, (err) => {
    if (err) {
      console.error("DB Error:", err.message);
      return;
    }
    console.log("SQLite Connected");
  });
}

function safeRun(sql, params = []) {
  activeDb.run(sql, params, (err) => {
    if (err) {
      console.error("SQLite run error:", err.message);
      if (isUnsupportedFormatError(err)) {
        recoverDatabase();
      }
    }
  });
}

function ensureColumns(tableName, expectedColumns) {
  activeDb.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
    if (err || !rows) {
      if (err) console.error(`SQLite pragma error (${tableName}):`, err.message);
      if (err && isUnsupportedFormatError(err)) {
        recoverDatabase();
      }
      return;
    }

    const existing = new Set(rows.map((row) => row.name));
    expectedColumns.forEach(({ name, definition }) => {
      if (!existing.has(name)) {
        safeRun(`ALTER TABLE ${tableName} ADD COLUMN ${name} ${definition}`);
      }
    });
  });
}

function ensureSchema() {
  activeDb.serialize(() => {
    safeRun(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      )
    `);

    safeRun(`
      CREATE TABLE IF NOT EXISTS cases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT,
        source_url TEXT,
        pdf_url TEXT,
        file_path TEXT,
        pdf_blob BLOB,
        pdf_mime TEXT,
        pdf_name TEXT,
        extracted_text TEXT,
        uploaded_at TEXT DEFAULT (datetime('now'))
      )
    `);

    safeRun(`
      CREATE TABLE IF NOT EXISTS summaries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        case_id INTEGER NOT NULL,
        background TEXT,
        legal_issues TEXT,
        arguments TEXT,
        court_reasoning TEXT,
        judgment_outcome TEXT,
        full_summary TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    safeRun(`
      CREATE TABLE IF NOT EXISTS audio_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        case_id INTEGER NOT NULL,
        summary_id INTEGER,
        language TEXT DEFAULT 'en',
        audio_url TEXT NOT NULL,
        audio_urls_json TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    safeRun(`
      CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        case_id INTEGER,
        case_title TEXT,
        listened_at TEXT DEFAULT (datetime('now')),
        language TEXT DEFAULT 'en'
      )
    `);

    safeRun(`
      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        case_id INTEGER,
        note_text TEXT,
        notes_path TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    ensureColumns("cases", [
      { name: "title", definition: "TEXT" },
      { name: "source_url", definition: "TEXT" },
      { name: "pdf_url", definition: "TEXT" },
      { name: "file_path", definition: "TEXT" },
      { name: "pdf_blob", definition: "BLOB" },
      { name: "pdf_mime", definition: "TEXT" },
      { name: "pdf_name", definition: "TEXT" },
      { name: "extracted_text", definition: "TEXT" },
      { name: "uploaded_at", definition: "TEXT" },
    ]);

    ensureColumns("history", [
      { name: "case_id", definition: "INTEGER" },
      { name: "case_title", definition: "TEXT" },
      { name: "listened_at", definition: "TEXT" },
      { name: "language", definition: "TEXT DEFAULT 'en'" },
    ]);

    ensureColumns("notes", [
      { name: "note_text", definition: "TEXT" },
      { name: "notes_path", definition: "TEXT" },
      { name: "created_at", definition: "TEXT" },
    ]);

    ensureColumns("audio_records", [
      { name: "audio_urls_json", definition: "TEXT" },
    ]);
  });
}

function recoverDatabase() {
  if (recoveryInProgress || recoveredOnce) return;
  recoveryInProgress = true;
  recoveredOnce = true;

  activeDb.close(() => {
    try {
      backupCorruptedDb();
    } catch (error) {
      activeDbPath = path.join(
        __dirname,
        `../../database.recovered.${Date.now()}.db`
      );
      console.error(
        `Corrupt DB backup failed (${error.message}). Switched to recovery DB: ${activeDbPath}`
      );
    }
    openDatabase();
    ensureSchema();
    recoveryInProgress = false;
  });
}

function initializeDatabase() {
  openDatabase();

  activeDb.get("PRAGMA schema_version;", [], (err) => {
    if (err && isUnsupportedFormatError(err)) {
      try {
        activeDb.close(() => {
          backupCorruptedDb();
          openDatabase();
          ensureSchema();
        });
      } catch (closeErr) {
        console.error("DB recovery failed:", closeErr.message);
      }
      return;
    }

    ensureSchema();
  });
}

initializeDatabase();

module.exports = db;
