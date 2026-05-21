const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

// Pfad zum db-Ordner eine Ebene über /js
const dbFolderPath = path.join(__dirname, "../..", "db");
const dbFilePath = path.join(dbFolderPath, "highscores.db");

// Ordner anlegen, falls er noch nicht existiert
if (!fs.existsSync(dbFolderPath)) {
  fs.mkdirSync(dbFolderPath, { recursive: true });
}

// Datenbank öffnen oder neu anlegen
const db = new DatabaseSync(dbFilePath);

// Tabelle anlegen, falls sie noch nicht existiert
db.exec(`
  CREATE TABLE IF NOT EXISTS highscores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_name TEXT NOT NULL UNIQUE,
    wins INTEGER NOT NULL DEFAULT 0
  )
`);

const findPlayerStatement = db.prepare(`
  SELECT player_name, wins
  FROM highscores
  WHERE player_name = ?
`);

const insertPlayerStatement = db.prepare(`
  INSERT INTO highscores (player_name, wins)
  VALUES (?, 1)
`);

const increaseWinStatement = db.prepare(`
  UPDATE highscores
  SET wins = wins + 1
  WHERE player_name = ?
`);

const readHighscoresStatement = db.prepare(`
  SELECT player_name AS playerName, wins
  FROM highscores
  ORDER BY wins DESC, player_name ASC
`);

function normalizePlayerName(playerName) {
  if (typeof playerName !== "string") {
    throw new Error("playerName muss ein String sein.");
  }

  const trimmedName = playerName.trim();

  if (trimmedName.length === 0) {
    throw new Error("playerName darf nicht leer sein.");
  }

  return trimmedName;
}

function saveWin(playerName) {
  const normalizedName = normalizePlayerName(playerName);
  const existingPlayer = findPlayerStatement.get(normalizedName);

  if (existingPlayer) {
    increaseWinStatement.run(normalizedName);
  } else {
    insertPlayerStatement.run(normalizedName);
  }

  return readHighscores();
}

function readHighscores() {
  return readHighscoresStatement.all();
}

module.exports = {
  saveWin,
  readHighscores,
  dbFilePath
};