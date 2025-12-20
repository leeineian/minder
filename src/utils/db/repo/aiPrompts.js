const db = require('../client');

module.exports = {
    /**
     * Get a user's custom prompt. Returns undefined if not found.
     */
    get: (userId) => {
        const row = db.prepare('SELECT prompt FROM user_ai_prompts WHERE userId = ?').get(userId);
        return row ? row.prompt : undefined;
    },

    /**
     * Set (upsert) a user's custom prompt.
     */
    set: (userId, prompt) => {
        const stmt = db.prepare('INSERT OR REPLACE INTO user_ai_prompts (userId, prompt) VALUES (?, ?)');
        const info = stmt.run(userId, prompt);
        return info.changes;
    },

    /**
     * Delete a user's custom prompt (reset to default).
     */
    delete: (userId) => {
        const stmt = db.prepare('DELETE FROM user_ai_prompts WHERE userId = ?');
        const info = stmt.run(userId);
        return info.changes;
    }
};
