const db = require('../client');
const ConsoleLogger = require('../../consoleLogger');

// Cache prepared statements
const stmt = {
    getBarrier: db.prepare('SELECT timestamp FROM ai_memory_barriers WHERE channelId = ?'),
    setBarrier: db.prepare('INSERT OR REPLACE INTO ai_memory_barriers (channelId, timestamp) VALUES (?, ?)')
};

module.exports = {
    /**
     * Get the timestamp of the last memory reset for this channel.
     * Returns 0 if never reset.
     */
    getBarrier: (channelId) => {
        try {
            const row = stmt.getBarrier.get(channelId);
            return row ? row.timestamp : 0;
        } catch (error) {
            ConsoleLogger.error('Database', 'Failed to get AI memory barrier:', error);
            return 0;
        }
    },

    /**
     * Set a new barrier for this channel to "now".
     * AI will effectively ignore messages before this point.
     */
    reset: (channelId) => {
        try {
            const now = Date.now();
            stmt.setBarrier.run(channelId, now);
            return now;
        } catch (error) {
            ConsoleLogger.error('Database', 'Failed to reset AI memory:', error);
            return 0;
        }
    }
};

