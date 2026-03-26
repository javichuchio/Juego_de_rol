const path = require("path");
const Database = require("better-sqlite3");

const DB_PATH = path.join(__dirname, "data.sqlite");

// Abre la BD (se crea si no existe) y garantiza el esquema.
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS progress (
    user_id INTEGER PRIMARY KEY,
    xp INTEGER NOT NULL DEFAULT 0,
    health INTEGER NOT NULL DEFAULT 100,
    gold INTEGER NOT NULL DEFAULT 50,
    current_weapon_index INTEGER NOT NULL DEFAULT 0,
    inventory_json TEXT NOT NULL DEFAULT '["palo"]',
    location TEXT NOT NULL DEFAULT 'town',
    won_dragon INTEGER NOT NULL DEFAULT 0,
    game_over INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

module.exports = db;

