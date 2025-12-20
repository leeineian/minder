const { Events, MessageFlags } = require('discord.js');
const chalk = require('chalk');
const statusRotator = require('../scripts/statusRotator');
const { logAction, getLoggingConfig } = require('../utils/logger');

// Helper to format options for auto-logging
function formatCommandOptions(interaction) {
    if (!interaction.options.data.length) return 'No options provided';

    const formatOption = (opt) => {
        if (opt.options) {
            // It's a subcommand or group
            const subOptions = opt.options.map(formatOption).join(', ');
            if (!subOptions) return `Subcommand: ${opt.name}`;
            return `${opt.name}: [${subOptions}]`;
        }
        return `${opt.name}: ${opt.value}`;
    };

    return interaction.options.data.map(formatOption).join('\n');
}

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        const client = interaction.client;

        try {
            console.log(`Received interaction: ${interaction.type} (ID: ${interaction.id})`);
            
            // Dynamic Status
            statusRotator.recordActivity(client);
            
            // Button Handling
            if (interaction.isButton()) {
                const button = client.buttons.get(interaction.customId);
                if (!button) {
                    console.error(chalk.red(`No handler matching ${interaction.customId} was found.`));
                    await interaction.reply({ content: 'This button is no longer active.', flags: MessageFlags.Ephemeral });
                    return;
                }

                try {
                    await button.execute(interaction, client);
                } catch (error) {
                    console.error(error);
                    if (!interaction.replied && !interaction.deferred) { 
                        await interaction.reply({ content: 'There was an error while executing this button!', flags: MessageFlags.Ephemeral });
                    }
                }
                return;
            }

            if (!interaction.isChatInputCommand()) {
                // Select Menu Handling (via global handlers)
                if (interaction.isStringSelectMenu()) {
                    const handler = client.componentHandlers.get(interaction.customId);
                    if (!handler) {
                        console.error(chalk.red(`No handler matching ${interaction.customId} was found.`));
                        await interaction.reply({ content: 'This interaction is no longer valid.', flags: MessageFlags.Ephemeral });
                        return;
                    }

                    try {
                        await handler(interaction, client);
                    } catch (error) {
                        console.error(error);
                        if (!interaction.replied && !interaction.deferred) { 
                            await interaction.reply({ content: 'Error processing interaction.', flags: MessageFlags.Ephemeral });
                        }
                    }
                    return;
                }
                return;
            }

            const command = client.commands.get(interaction.commandName);

            if (!command) {
                console.error(chalk.red(`No command matching ${interaction.commandName} was found.`));
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
                    await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
                }
            }

            // Auto-Logging
            const config = getLoggingConfig();
            if (interaction.guildId && config[interaction.guildId]?.enabled) {
                const finalDetails = logDetails || formatCommandOptions(interaction);
                logAction(client, interaction.guildId, interaction.user, `Used /${interaction.commandName}`, finalDetails);
            }

        } catch (error) {
            console.error(chalk.red('Uncaptured interaction error:'), error);
        }
    },
};
