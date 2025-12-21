const path = require('path');

module.exports = {
   LIMITS: {
       MAX_TIMEOUT_MS: 2147483647, // 32-bit integer limit
       MAX_MESSAGE_LENGTH: 2000,
   },
   PATHS: {
       // Root directory is src/configs/../.. = .
       PID_FILE: path.join(__dirname, '../../.bot.pid')
   },
   TIMEZONE: process.env.BOT_TIMEZONE || 'UTC'
};

