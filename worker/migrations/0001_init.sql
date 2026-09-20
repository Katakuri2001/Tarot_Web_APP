-- Velora Tarot Admin Schema
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  passwordHash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin','user')),
  isActive INTEGER NOT NULL DEFAULT 1,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  lastLogin TEXT
);

CREATE TABLE IF NOT EXISTS tarot_cards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  arcana TEXT NOT NULL CHECK (arcana IN ('major','wands','cups','swords','pentacles')),
  suit TEXT,
  number INTEGER NOT NULL,
  keywords TEXT NOT NULL DEFAULT '[]',
  symbolism TEXT NOT NULL DEFAULT '',
  uprightMeaning TEXT NOT NULL,
  reversedMeaning TEXT NOT NULL,
  loveUpright TEXT NOT NULL,
  loveReversed TEXT NOT NULL,
  careerUpright TEXT NOT NULL,
  careerReversed TEXT NOT NULL,
  generalUpright TEXT NOT NULL,
  generalReversed TEXT NOT NULL,
  advice TEXT NOT NULL,
  isActive INTEGER NOT NULL DEFAULT 1,
  imageKey TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS readings (
  id TEXT PRIMARY KEY,
  userId TEXT REFERENCES users(id) ON DELETE SET NULL,
  readingType TEXT NOT NULL CHECK (readingType IN ('daily','love','career','general')),
  question TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reading_cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  readingId TEXT NOT NULL REFERENCES readings(id) ON DELETE CASCADE,
  cardId TEXT REFERENCES tarot_cards(id) ON DELETE SET NULL,
  cardName TEXT NOT NULL,
  position TEXT NOT NULL,
  orientation TEXT NOT NULL CHECK (orientation IN ('upright','reversed')),
  interpretation TEXT
);

CREATE TABLE IF NOT EXISTS admin_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  adminId TEXT NOT NULL,
  adminName TEXT,
  action TEXT NOT NULL,
  entityType TEXT NOT NULL,
  entityId TEXT,
  metadata TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_readings_createdAt ON readings(createdAt);
CREATE INDEX IF NOT EXISTS idx_readings_type ON readings(readingType);
CREATE INDEX IF NOT EXISTS idx_readings_user ON readings(userId);
CREATE INDEX IF NOT EXISTS idx_reading_cards_card ON reading_cards(cardId);
CREATE INDEX IF NOT EXISTS idx_reading_cards_reading ON reading_cards(readingId);
CREATE INDEX IF NOT EXISTS idx_users_createdAt ON users(createdAt);
