const db = require("../src/config/db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT,
      source_url TEXT,
      pdf_url TEXT,
      file_path TEXT,
      extracted_text TEXT,
      uploaded_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
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

  db.run(`
    CREATE TABLE IF NOT EXISTS audio_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      case_id INTEGER NOT NULL,
      summary_id INTEGER,
      language TEXT DEFAULT 'en',
      audio_url TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      case_id INTEGER,
      case_title TEXT,
      listened_at TEXT DEFAULT (datetime('now')),
      language TEXT DEFAULT 'en'
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      case_id INTEGER,
      note_text TEXT,
      notes_path TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  console.log("Tables created successfully");
});
