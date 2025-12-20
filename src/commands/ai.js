const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const userPrompts = require('../utils/db/repo/aiPrompts');
const aiMemory = require('../utils/db/repo/aiMemory');
const DEFAULT_SYSTEM_PROMPT = "Answer concisely.";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ai')
        .setDescription('Manage AI settings')
        // Subcommand Group: PROMPT
        .addSubcommandGroup(group =>
            group
                .setName('prompt')
                .setDescription('Manage your custom AI personality')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('set')
                        .setDescription('Set a custom system prompt')
                        .addStringOption(option =>
                            option.setName('text')
                                .setDescription('The system prompt (e.g., "You are a pirate")')
                                .setRequired(true)))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('reset')
                        .setDescription('Reset your prompt to default'))
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('view')
                        .setDescription('View your current custom prompt')))
        // Subcommand Group: MEMORY
        .addSubcommandGroup(group =>
            group
                .setName('memory')
                .setDescription('Manage AI context memory')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('reset')
                        .setDescription('Clears the AI memory for this channel (starts fresh)'))),
    
    async execute(interaction) {
        const group = interaction.options.getSubcommandGroup();
        const subcommand = interaction.options.getSubcommand();
        const userId = interaction.user.id;

        // --- PROMPT GROUP ---
        if (group === 'prompt') {
            if (subcommand === 'set') {
                const text = interaction.options.getString('text');
                if (text.length > 1000) return interaction.reply({ content: '❌ Too long!', flags: MessageFlags.Ephemeral });
                
                userPrompts.set(userId, text);
                return interaction.reply({ 
                    content: `✅ **Custom Prompt Set!**\n> *${text}*`, 
                    flags: MessageFlags.Ephemeral 
                });

            } else if (subcommand === 'reset') {
                userPrompts.delete(userId);
                return interaction.reply({ 
                    content: `🔄 **Prompt Reset.**\n> Default: *${DEFAULT_SYSTEM_PROMPT}*`, 
                    flags: MessageFlags.Ephemeral 
                });

            } else if (subcommand === 'view') {
                const prompt = userPrompts.get(userId) || DEFAULT_SYSTEM_PROMPT;
                return interaction.reply({ 
                    content: `**Your Prompt:**\n> ${prompt}`, 
                    flags: MessageFlags.Ephemeral 
                });
            }
        }

        // --- MEMORY GROUP ---
        if (group === 'memory') {
            if (subcommand === 'reset') {
                const channelId = interaction.channelId;
                aiMemory.reset(channelId);
                
                // This is NOT ephemeral, so everyone knows the context was wiped
                return interaction.reply({ 
                    content: `🧠 **AI Memory Wiped.**\nI have forgotten everything said in this channel before this moment.` 
                });
            }
        }
    },
};
