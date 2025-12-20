const db = require('../client');

module.exports = {
    /**
     * Get the timestamp of the last memory reset for this channel.
     * Returns 0 if never reset.
     */
    getBarrier: (channelId) => {
        const row = db.prepare('SELECT timestamp FROM ai_memory_barriers WHERE channelId = ?').get(channelId);
        return row ? row.timestamp : 0;
    },

    /**
     * Set a new barrier for this channel to "now".
     * AI will effectively ignore messages before this point.
     */
    reset: (channelId) => {
        const now = Date.now();
        const stmt = db.prepare('INSERT OR REPLACE INTO ai_memory_barriers (channelId, timestamp) VALUES (?, ?)');
        stmt.run(channelId, now);
        return now;
    }
};
