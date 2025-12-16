const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with bot latency.'),
	async execute(interaction, client) {
        const sent = Date.now();
        const roundtrip = sent - interaction.createdTimestamp;
        const ping = client.ws.ping;
        
const V2Builder = require('../utils/components');

// ...
        
        // Components V2 Container
        const v2Container = V2Builder.container([
            V2Builder.section(
                `Pong! 🏓\nRoundtrip: \`${roundtrip}ms\`\nHeartbeat: \`${ping}ms\``,
                V2Builder.button('Refresh', 'ping_refresh', 2)
            )
        ]);

        await interaction.reply({ 
            flags: MessageFlags.IsComponentsV2,
            components: [v2Container] 
        });

        return `Latency check: ${ping}ms`;
	},
};
