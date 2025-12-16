const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getLoggingConfig, saveLoggingConfig, logAction } = require('../utils/logger');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('log')
		.setDescription('Configure logging for this server')
		.addChannelOption(option =>
			option.setName('channel')
				.setDescription('The channel to send logs to'))
		.addBooleanOption(option =>
			option.setName('toggle')
				.setDescription('Enable or disable logging'))
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	async execute(interaction, client) {
        // Double check permissions (though setDefaultMemberPermissions handles it at API level usually)
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }
        
        const channel = interaction.options.getChannel('channel');
        const toggle = interaction.options.getBoolean('toggle');
        const loggingConfig = getLoggingConfig();

        if (!loggingConfig[interaction.guildId]) {
            loggingConfig[interaction.guildId] = { enabled: false, channelId: null };
        }

        let response = '';

        if (channel) {
            loggingConfig[interaction.guildId].channelId = channel.id;
            response += `Logging channel set to ${channel}.\n`;
        }
        
        if (toggle !== null) {
            loggingConfig[interaction.guildId].enabled = toggle;
            response += `Logging enabled: ${toggle}.\n`;
        }

        if (!channel && toggle === null) {
            const current = loggingConfig[interaction.guildId];
             response = `Logging is ${current.enabled ? 'enabled' : 'disabled'}. Channel: ${current.channelId ? `<#${current.channelId}>` : 'Not set'}.`;
        }

        await saveLoggingConfig();
        await interaction.reply({ content: response || 'Config updated.', ephemeral: true });
        
        return response || 'Config updated';
	},
};
