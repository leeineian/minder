const { MessageFlags } = require('discord.js');
const V2Builder = require('./components');
const db = require('./database');
const ConsoleLogger = require('./consoleLogger');
const { LIMITS } = require('../configs/constants');

module.exports = {
    /**
     * Schedules a reminder for delivery.
     * Handles delays larger than setTimeout limit (24.8 days) by recursively rescheduling.
     * 
     * @param {import('discord.js').Client} client 
     * @param {string} userId 
     * @param {string} channelId 
     * @param {string} message 
     * @param {number|string} dbId 
     * @param {string} deliveryType 'dm' or 'channel'
     * @param {number} dueAt Timestamp
     */
    scheduleReminder(client, userId, channelId, message, dbId, deliveryType, dueAt) {
        const now = Date.now();
        const delay = dueAt - now;
        const MAX_DELAY = LIMITS.MAX_TIMEOUT_MS; // 2^31 - 1 (~24.8 days)

        if (delay <= 0) {
            // Send immediately
            this.sendReminder(client, userId, channelId, message, dbId, deliveryType);
        } else if (delay > MAX_DELAY) {
            // Too long for a single setTimeout, wait MAX_DELAY then check again
            const daysAway = Math.floor(delay / 86400000);
            const daysToWait = Math.floor(MAX_DELAY / 86400000);
            ConsoleLogger.warn('ReminderScheduler', `Reminder ${dbId} is ${daysAway} days away. Will reschedule in ${daysToWait} days. If bot restarts before then, reminder will be rescheduled from database.`);
            
            setTimeout(() => {
                this.scheduleReminder(client, userId, channelId, message, dbId, deliveryType, dueAt);
            }, MAX_DELAY);
        } else {
            // Safe to schedule directly
            setTimeout(() => {
                this.sendReminder(client, userId, channelId, message, dbId, deliveryType);
            }, delay);
        }
    },

    /**
     * Sends the reminder payload and removes it from the database.
     * Implements idempotency to prevent duplicate sends on bot restarts.
     */
    async sendReminder(client, userId, channelId, message, dbId, deliveryType = 'dm') {
        try {
            // Check if already sent (idempotency check)
            const checkStmt = db.prepare('SELECT sent_at FROM reminders WHERE id = ?');
            const existing = checkStmt.get(dbId);
            
            if (existing?.sent_at) {
                ConsoleLogger.warn('ReminderScheduler', 
                    `Reminder ${dbId} already sent at ${new Date(existing.sent_at).toISOString()}, skipping.`);
                return;
            }

            // Mark as sending (optimistic lock)
            const marked = db.markReminderAsSent(dbId);
            if (!marked) {
                ConsoleLogger.warn('ReminderScheduler', 
                    `Reminder ${dbId} already being sent by another process, skipping.`);
                return;
            }

            const reminderText = `⏰ **Time's Up, <@${userId}>!**\nReminder: "${message}"`;
            
            const v2Container = V2Builder.container([
                V2Builder.textDisplay(reminderText),
                V2Builder.actionRow([
                    V2Builder.button('Dismiss', 'dismiss_message', 4)
                ])
            ]);

            let deliverySuccess = false;

            if (deliveryType === 'channel' && channelId) {
                try {
                    const channel = await client.channels.fetch(channelId);
                    if (channel) {
                        await channel.send({ 
                            flags: MessageFlags.IsComponentsV2,
                            components: [v2Container] 
                        });
                        deliverySuccess = true;
                    }

                } catch (channelError) {
                    ConsoleLogger.error('ReminderScheduler', `Channel Delivery Failed (Channel: ${channelId}):`, channelError);
                }
            } else {
                // DM Delivery
                try {
                    const user = await client.users.fetch(userId);
                    if (user) {
                         await user.send({ 
                            components: [v2Container],
                            flags: MessageFlags.IsComponentsV2
                        });
                        deliverySuccess = true;
                    }
                } catch (dmError) {
                    ConsoleLogger.error('ReminderScheduler', `DM Delivery Failed (User: ${userId}):`, dmError);
                    
                    // Fallback to channel if DM fails
                    if (channelId) {
                        try {
                            const channel = await client.channels.fetch(channelId);
                            if (channel) {
                                await channel.send({ 
                                    content: `<@${userId}> I couldn't DM you.`,
                                    flags: MessageFlags.IsComponentsV2,
                                    components: [v2Container] 
                                });
                                deliverySuccess = true;
                            }
                        } catch (channelError) {
                            ConsoleLogger.error('ReminderScheduler', `Fallback Delivery Failed (Channel: ${channelId}):`, channelError);
                        }
                    }
                }
            }

            if (deliverySuccess) {
                // Success - delete from database
                db.deleteReminder(dbId);
                ConsoleLogger.success('ReminderScheduler', `Reminder ${dbId} delivered and removed from database.`);
            } else {
                // Delivery failed - reset sent_at to allow retry on next restore
                db.resetReminderSentStatus(dbId);
                ConsoleLogger.error('ReminderScheduler', 
                    `Reminder ${dbId} delivery failed, sent_at reset for retry on next bot restart.`);
            }

        } catch (error) {
            ConsoleLogger.error('ReminderScheduler', `Failed to deliver reminder ${dbId}:`, error);
            // Reset sent_at on error to allow retry
            try {
                db.resetReminderSentStatus(dbId);
            } catch (resetError) {
                ConsoleLogger.error('ReminderScheduler', `Failed to reset sent_at for reminder ${dbId}:`, resetError);
}
        }
    }
};
