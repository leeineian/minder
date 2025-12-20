const { Events } = require('discord.js');
const chalk = require('chalk');
const { performance } = require('perf_hooks');
const webhookPinger = require('../scripts/webhookPinger');
const statusRotator = require('../scripts/statusRotator');
const randomRoleColor = require('../scripts/randomRoleColor');
const db = require('../utils/database');
const reminder = require('../commands/reminder');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(chalk.green(`[Start] Ready! Logged in as ${client.user.tag} (Startup: ${performance.now().toFixed(2)}ms)`));
        
        // Start Background Scripts
        statusRotator.start(client);
        randomRoleColor.start(client);

        // Initialize Ping Persistence
        await webhookPinger.initialize(client);

        // Restore Reminders
        try {
            // Synchronous call - no await
            const pending = db.getAllPendingReminders();
            console.log(chalk.blue(`Restoring ${pending.length} pending reminders...`));
            
            let restoredCount = 0;

            for (const r of pending) {
                // Restore using safe scheduler
                reminder.scheduleReminder(client, r.userId, r.channelId, r.message, r.id, r.deliveryType, r.dueAt);
                restoredCount++;
            }
            console.log(chalk.blue(`Restored ${restoredCount} reminders.`));
        } catch (err) {
            console.error(chalk.red('Failed to restore reminders:'), err);
        }
    },
};
