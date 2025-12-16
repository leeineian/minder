const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('say')
		.setDescription('Repeats your input back to you.')
		.addStringOption(option =>
			option.setName('message')
				.setDescription('The message to say')
				.setRequired(true)),
	async execute(interaction) {
		const userInput = interaction.options.getString('message');
        
        if (userInput.length > 2000) {
            return interaction.reply({ content: 'Message is too long (limit is 2000 characters).', ephemeral: true });
        }

		await interaction.reply({ content: userInput, ephemeral: true });
        return `Message: ${userInput}`;
	},
};
