const { ActivityType } = require('discord.js');
const db = require('../utils/database');
const { getNextUpdateTimestamp, getCurrentColor } = require('./randomRoleColor');

const ROTATION_INTERVAL_MS = 60000; // 60 Seconds (Safe for rate limits)
const START_TIME = Date.now();

const statusGenerators = [
    // 1. Pending Reminders
    async () => {
        try {
            const count = await db.getRemindersCount();
            return { 
                name: 'Custom Status', 
                type: ActivityType.Custom, 
                state: `Serving ${count} pending reminders` 
            };
        } catch (e) {
            console.error('Failed to fetching reminder count for status:', e);
            return null;
        }
    },
    
    // 2. Color Update
    async () => {
        const nextUpdate = getNextUpdateTimestamp();
        const currentColor = getCurrentColor();
        if (!nextUpdate) return null;
        
        const diffMinutes = Math.ceil((nextUpdate - Date.now()) / 60000);
        
        const timeStr = diffMinutes === 1 ? '1 minute' : `${diffMinutes} minutes`;
        return {
            name: 'Custom Status',
            type: ActivityType.Custom,
            state: `${currentColor} in ${timeStr}`
        };
    },

    // 3. Uptime
    async () => {
        const uptimeMs = Date.now() - START_TIME;
        const hours = Math.floor(uptimeMs / 3600000);
        const minutes = Math.floor((uptimeMs % 3600000) / 60000);
        
        return {
            name: 'Custom Status', 
            type: ActivityType.Custom, 
            state: `Uptime: ${hours}h ${minutes}m`
        };
    },

    // 4. Latency
    async (client) => {
        return {
            name: 'Custom Status',
            type: ActivityType.Custom,
            state: `Ping: ${Math.round(client.ws.ping)}ms`
        };
    },

    // 5. UTC Time
    async () => {
        const now = new Date();
        const timeStr = now.toISOString().split('T')[1].substring(0, 5); // HH:MM
        return {
            name: 'Custom Status',
            type: ActivityType.Custom,
            state: `Time: ${timeStr} UTC`
        };
    }
];

async function updateStatus(client) {
    // Pick a random status
    const index = Math.floor(Math.random() * statusGenerators.length);
    const statusGenerator = statusGenerators[index];
    
    const presenceData = await statusGenerator(client);
    if (presenceData) {
        client.user.setPresence({
            activities: [presenceData],
            status: 'dnd',
        });
    }
}

module.exports = {
    start: (client) => {
        console.log('[StatusRotator] Started.');
        
        // Initial Update
        updateStatus(client);

        // Interval
        setInterval(() => {
            updateStatus(client);
        }, ROTATION_INTERVAL_MS);
    }
};
