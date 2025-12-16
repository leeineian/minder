const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('message')
		.setDescription('Sends a message to the channel.')
		.addStringOption(option =>
			option.setName('message')
				.setDescription('The message to send')
				.setRequired(true)),
	async execute(interaction) {
		const userInput = interaction.options.getString('message');
        
        if (userInput.length > 2000) {
            return interaction.reply({ content: 'Message is too long (limit is 2000 characters).', ephemeral: true });
        }

		try {
			await interaction.channel.send(userInput);
			await interaction.reply({ content: 'Message sent!', ephemeral: true });
            return `Channel: ${interaction.channel}\nMessage: ${userInput}`;
		} catch (error) {
			console.error(error);
			await interaction.reply({ content: 'Failed to send message: permission missing?', ephemeral: true });
            return null; // Return null if action failed (or handle how you want logging)
		}
	},
};
