const { SlashCommandBuilder, MessageFlags, ComponentType } = require('discord.js');
const os = require('os');
const V2Builder = require('../utils/components');

// --- ANSI Helper ---
const fmt = {
    reset: '\u001b[0m',
    bold: '\u001b[1m',
    dim: '\u001b[2m',
    gray: '\u001b[30;1m',
    red: '\u001b[31m',
    green: '\u001b[32m',
    yellow: '\u001b[33m',
    blue: '\u001b[34m',
    pink: '\u001b[35m',
    pink_bold: '\u001b[35;1m',
    cyan: '\u001b[36m',
    white: '\u001b[37m',
};
const title = (text) => `${fmt.pink}${text}${fmt.reset}`;
const key = (text) => `${fmt.pink}> ${text}:${fmt.reset}`;
const val = (text) => `${fmt.pink_bold}${text}${fmt.reset}`;

// --- Data Gathering (Module Level) ---
const getSystemStats = () => {
    const usedMem = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
    return [
        title('System'),
        `${key('Platform')} ${val(process.platform)}`,
        `${key('Operating System')} ${val(os.type() + ' ' + os.release())}`,
        `${key('Memory')} ${val(`${usedMem} MB / ${totalMem} GB`)}`,
        `${key('CPU')} ${val(os.cpus()[0].model)}`
    ].join('\n');
};

const getAppStats = (client) => {
        // UPTIME
    const uptimeSeconds = Math.floor(process.uptime());
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const uptimeStr = `${days}d ${hours}h ${minutes}m`;
    const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);

    return [
        title('App'),
        `${key('Versions')} ${val(`Bun ${Bun.version} / DJS ${require('discord.js').version}`)}`,
        `${key('Uptime')} ${val(uptimeStr)}`,
        `${key('Servers')} ${val(client.guilds.cache.size)}`,
        `${key('Users')} ${val(totalUsers)}`
    ].join('\n');
};

// --- Render Helper ---
const render = (selection, client) => {
    let output = '';
    if (selection === 'system') {
        output = getSystemStats();
    } else if (selection === 'app') {
        output = getAppStats(client);
    } else {
        // All
        output = getSystemStats() + '\n\n' + getAppStats(client);
    }
    
    const v2Container = V2Builder.container([
        V2Builder.textDisplay(`\`\`\`ansi\n${output}\n\`\`\``),
        V2Builder.actionRow([
            V2Builder.selectMenu('stats_filter', [
                { label: 'All', value: 'all', description: 'Show all statistics', default: selection === 'all' },
                { label: 'System', value: 'system', description: 'Show system hardware stats', default: selection === 'system' },
                { label: 'App', value: 'app', description: 'Show application stats', default: selection === 'app' }
            ], 'Filter Statistics')
        ])
    ]);
    return v2Container;
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Displays system and application statistics'),
    
    async execute(interaction, client) {
        // --- Initial Reply ---
        await interaction.reply({
            components: [render('all', client)],
            flags: MessageFlags.IsComponentsV2
        });
    },

    // --- Persistent Handlers ---
    handlers: {
        'stats_filter': async (interaction, client) => {
            const selection = interaction.values[0];
            await interaction.update({
                components: [render(selection, client)],
                flags: MessageFlags.IsComponentsV2
            });
        }
    }
};
