const ConsoleLogger = require('../consoleLogger');

/**
 * Database Migration System
 * 
 * Migrations are run sequentially in order of version number.
 * Each migration is run exactly once and recorded in the _migrations table.
 */

const MIGRATIONS = [
    {
        version: 1,
        name: 'Initial Schema',
        up: (db) => {
            // 1. Reminders
            db.run(`
                CREATE TABLE IF NOT EXISTS reminders (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    userId TEXT NOT NULL,
                    channelId TEXT,
                    message TEXT NOT NULL,
                    dueAt INTEGER NOT NULL,
                    deliveryType TEXT DEFAULT 'dm',
                    createdAt INTEGER NOT NULL
                )
            `);
            db.run('CREATE INDEX IF NOT EXISTS idx_userId ON reminders(userId)');
            db.run('CREATE INDEX IF NOT EXISTS idx_dueAt ON reminders(dueAt)');

            // 2. Guild Configs
            db.run(`
                CREATE TABLE IF NOT EXISTS guild_configs (
                    guildId TEXT PRIMARY KEY,
                    config TEXT NOT NULL
                )
            `);

            // 3. User AI Prompts
            db.run(`
                CREATE TABLE IF NOT EXISTS user_ai_prompts (
                    userId TEXT PRIMARY KEY,
                    prompt TEXT NOT NULL
                )
            `);

            // 4. AI Memory Barriers
            db.run(`
                CREATE TABLE IF NOT EXISTS ai_memory_barriers (
                    channelId TEXT PRIMARY KEY,
                    timestamp INTEGER NOT NULL
                )
            `);

            // 5. Ping Categories
            db.run(`
                CREATE TABLE IF NOT EXISTS ping_categories (
                    categoryId TEXT PRIMARY KEY,
                    categoryName TEXT NOT NULL
                )
            `);
        }
    },
    
    {
        version: 2,
        name: 'Add sent_at column to reminders for idempotency',
        up: (db) => {
            db.run('ALTER TABLE reminders ADD COLUMN sent_at INTEGER DEFAULT NULL');
            db.run('CREATE INDEX IF NOT EXISTS idx_sent_at ON reminders(sent_at)');
        }
    }
];

/**
 * Runs all pending migrations
 */
function runMigrations(db) {
    // Create migrations tracking table
    db.run(`
        CREATE TABLE IF NOT EXISTS _migrations (
            version INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            applied_at INTEGER NOT NULL
        )
    `);

    const currentVersion = db.prepare('SELECT MAX(version) as v FROM _migrations').get()?.v || 0;
    
    ConsoleLogger.info('Migrations', `Current database version: ${currentVersion}`);

    let migrationsApplied = 0;
    for (const migration of MIGRATIONS) {
        if (migration.version > currentVersion) {
            ConsoleLogger.info('Migrations', `Running migration ${migration.version}: ${migration.name}`);
            
            try {
                migration.up(db);
                db.prepare('INSERT INTO _migrations (version, name, applied_at) VALUES (?, ?, ?)').run(
                    migration.version,
                    migration.name,
                    Date.now()
                );
                migrationsApplied++;
                ConsoleLogger.success('Migrations', `✓ Migration ${migration.version} completed`);
            } catch (error) {
                ConsoleLogger.error('Migrations', `✗ Migration ${migration.version} failed:`, error);
                throw error; // Stop on first failure
            }
        }
    }

    if (migrationsApplied === 0) {
        ConsoleLogger.info('Migrations', 'Database is up to date');
    } else {
        ConsoleLogger.success('Migrations', `Applied ${migrationsApplied} migration(s)`);
    }
}

module.exports = { runMigrations };
