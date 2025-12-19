const Database = require('better-sqlite3');
const path = require('path');

// Resolve path to data.db (root directory)
const dbPath = path.resolve(__dirname, '../../data.db');

// Enable WAL mode (Write-Ahead Logging) for better concurrency and performance
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Initialize Tables
// 1. Reminders
db.prepare(`
    CREATE TABLE IF NOT EXISTS reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT NOT NULL,
        channelId TEXT,
        message TEXT NOT NULL,
        dueAt INTEGER NOT NULL,
        deliveryType TEXT DEFAULT 'dm',
        createdAt INTEGER NOT NULL
    )
`).run();

db.prepare('CREATE INDEX IF NOT EXISTS idx_userId ON reminders(userId)').run();
db.prepare('CREATE INDEX IF NOT EXISTS idx_dueAt ON reminders(dueAt)').run();

// 2. Guild Configs
db.prepare(`
    CREATE TABLE IF NOT EXISTS guild_configs (
        guildId TEXT PRIMARY KEY,
        config TEXT NOT NULL    -- JSON string for flexibility
    )
`).run();

console.log('[Database] Initialized with better-sqlite3 (data.db).');

module.exports = db;
