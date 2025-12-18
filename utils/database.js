const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../reminders.db');
// Enable WAL mode (Write-Ahead Logging) for better concurrency and performance
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Initialize Table
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

console.log('[Database] Initialized with better-sqlite3.');

// Config Table
db.prepare(`
    CREATE TABLE IF NOT EXISTS guild_configs (
        guildId TEXT PRIMARY KEY,
        config TEXT NOT NULL    -- JSON string for flexibility
    )
`).run();

module.exports = {
    // ... Reminder methods ...
    addReminder: (userId, channelId, message, dueAt, deliveryType = 'dm') => {
        const stmt = db.prepare('INSERT INTO reminders (userId, channelId, message, dueAt, deliveryType, createdAt) VALUES (?, ?, ?, ?, ?, ?)');
        const info = stmt.run(userId, channelId, message, dueAt, deliveryType, Date.now());
        return info.lastInsertRowid;
    },

    getReminders: (userId) => {
        return db.prepare('SELECT * FROM reminders WHERE userId = ? ORDER BY dueAt ASC').all(userId);
    },

    deleteReminder: (id) => {
        const info = db.prepare('DELETE FROM reminders WHERE id = ?').run(id);
        return info.changes;
    },

    getAllPendingReminders: () => {
        return db.prepare('SELECT * FROM reminders ORDER BY dueAt ASC').all();
    },

    getRemindersCount: () => {
        const row = db.prepare('SELECT COUNT(*) as count FROM reminders').get();
        return row.count;
    },

    // Config Methods
    setGuildConfig: (guildId, configObj) => {
        const json = JSON.stringify(configObj);
        db.prepare(`
            INSERT INTO guild_configs (guildId, config) VALUES (?, ?)
            ON CONFLICT(guildId) DO UPDATE SET config = excluded.config
        `).run(guildId, json);
    },

    getGuildConfig: (guildId) => {
        const row = db.prepare('SELECT config FROM guild_configs WHERE guildId = ?').get(guildId);
        return row ? JSON.parse(row.config) : null;
    },

    getAllGuildConfigs: () => {
        const rows = db.prepare('SELECT guildId, config FROM guild_configs').all();
        const configs = {};
        for (const row of rows) {
            configs[row.guildId] = JSON.parse(row.config);
        }
        return configs;
    }
};
