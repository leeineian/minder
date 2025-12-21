const db = require('../client');
const ConsoleLogger = require('../../consoleLogger');

// Cache prepared statements
const stmt = {
    get: db.prepare('SELECT prompt FROM user_ai_prompts WHERE userId = ?'),
    set: db.prepare('INSERT OR REPLACE INTO user_ai_prompts (userId, prompt) VALUES (?, ?)'),
    delete: db.prepare('DELETE FROM user_ai_prompts WHERE userId = ?')
};

module.exports = {
    /**
     * Get a user's custom prompt. Returns undefined if not found.
     */
    get: (userId) => {
        try {
            const row = stmt.get.get(userId);
            return row ? row.prompt : undefined;
        } catch (error) {
            ConsoleLogger.error('Database', 'Failed to get AI prompt:', error);
            return undefined;
        }
    },

    /**
     * Set (upsert) a user's custom prompt.
     */
    set: (userId, prompt) => {
        try {
            const info = stmt.set.run(userId, prompt);
            return info.changes;
        } catch (error) {
            ConsoleLogger.error('Database', 'Failed to set AI prompt:', error);
            return 0;
        }
    },

    /**
     * Delete a user's custom prompt (reset to default).
     */
    delete: (userId) => {
        try {
            const info = stmt.delete.run(userId);
            return info.changes;
        } catch (error) {
            ConsoleLogger.error('Database', 'Failed to delete AI prompt:', error);
            return 0;
        }
    }
};

