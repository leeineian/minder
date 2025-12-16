require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, Collection, Events, GatewayIntentBits, ActivityType, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { logAction } = require('./utils/logger');

const V2Builder = require('./utils/components');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Command Handling
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

client.once(Events.ClientReady, c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
	client.user.setActivity('Minding my own business', { type: ActivityType.Custom });
});

// Helper to format options for auto-logging
function formatCommandOptions(interaction) {
    if (!interaction.options.data.length) return 'No options provided';
    return interaction.options.data.map(opt => `${opt.name}: ${opt.value}`).join('\n');
}

client.on(Events.InteractionCreate, async interaction => {
    try {
        console.log(`Received interaction: ${interaction.type} (ID: ${interaction.id})`);
        
        // Button Handling (Specific logic for dismiss/refresh)
        if (interaction.isButton()) {
            if (interaction.customId === 'dismiss_log') {
               // ... (Keeping button logic inline or we could move it to handlers later)
                try {
                     if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                        return interaction.reply({ content: 'Only admins can dismiss logs.', ephemeral: true });
                    }
                    await interaction.message.delete();
                } catch (err) {
                     console.error('Failed to delete log:', err);
                     await interaction.reply({ content: 'Failed to delete log.', ephemeral: true });
                }
            } else if (interaction.customId === 'ping_refresh') {
                const sent = Date.now();
                const roundtrip = sent - interaction.createdTimestamp;
                const ping = client.ws.ping;

                 const v2Container = V2Builder.container([
                    V2Builder.section(
                        `Pong! 🏓\nRoundtrip: \`${roundtrip}ms\`\nHeartbeat: \`${ping}ms\``,
                        V2Builder.button('Refresh', 'ping_refresh', 2)
                    )
                ]);
                
                try {
                    await interaction.update({ 
                        components: [v2Container] 
                    });
                } catch (err) {
                     console.error('Failed to update ping:', err);
                     if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({ content: 'Failed to refresh ping.', ephemeral: true });
                     }
                }
            }
            return;
        }

        if (!interaction.isChatInputCommand()) return;

        const command = client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        // Execute Command
        let logDetails = null;
        try {
            // Commands return string/details if they want to override logging, or null/undefined
            const result = await command.execute(interaction, client);
            logDetails = result;
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
        }

        // Auto-Logging
        const finalDetails = logDetails || formatCommandOptions(interaction);
        logAction(client, interaction.guildId, interaction.user, `Used /${interaction.commandName}`, finalDetails);

    } catch (error) {
        console.error('Uncaptured interaction error:', error);
    }
});

client.login(process.env.DISCORD_TOKEN);
