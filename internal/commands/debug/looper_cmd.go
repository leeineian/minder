package debug

import (
	"fmt"

	"github.com/bwmarrin/discordgo"
	"github.com/leeineian/minder/internal/commands"
	"github.com/leeineian/minder/internal/daemons/looper"
)

var WebhookLooperCmd = &commands.Command{
	Name:        "debug",
	Description: "Debug utilities",
	Options: []*discordgo.ApplicationCommandOption{
		{
			Type:        discordgo.ApplicationCommandOptionSubCommandGroup,
			Name:        "webhook-looper",
			Description: "Manage webhook loops",
			Options: []*discordgo.ApplicationCommandOption{
				{
					Type:        discordgo.ApplicationCommandOptionSubCommand,
					Name:        "start",
					Description: "Start a webhook loop",
					Options: []*discordgo.ApplicationCommandOption{
						{
							Type:        discordgo.ApplicationCommandOptionString,
							Name:        "id",
							Description: "Channel ID to start loop for",
							Required:    true,
						},
						{
							Type:        discordgo.ApplicationCommandOptionInteger,
							Name:        "interval",
							Description: "Override interval (ms)",
							Required:    false,
						},
					},
				},
				{
					Type:        discordgo.ApplicationCommandOptionSubCommand,
					Name:        "stop",
					Description: "Stop a webhook loop",
					Options: []*discordgo.ApplicationCommandOption{
						{
							Type:        discordgo.ApplicationCommandOptionString,
							Name:        "id",
							Description: "Channel ID to stop loop for",
							Required:    true,
						},
					},
				},
				{
					Type:        discordgo.ApplicationCommandOptionSubCommand,
					Name:        "list",
					Description: "List running loops",
				},
			},
		},
	},
	Handler: handleDebug,
}

func handleDebug(s *discordgo.Session, i *discordgo.InteractionCreate) {
	options := i.ApplicationCommandData().Options

	switch options[0].Name {
	case "webhook-looper":
		handleLooper(s, i, options[0].Options)
	}
}

func handleLooper(s *discordgo.Session, i *discordgo.InteractionCreate, options []*discordgo.ApplicationCommandInteractionDataOption) {
	subCmd := options[0].Name

	switch subCmd {
	case "start":
		id := options[0].Options[0].StringValue()
		interval := 1000 // default
		if len(options[0].Options) > 1 {
			interval = int(options[0].Options[1].IntValue())
		}

		// Typically we load config from DB, but for now let's mock/force it for testing
		// Logic: Load config from DB -> looper.StartLoop

		// For the Rewrite MVP, we can assume the user wants to use the existing DB config.
		// looper.GlobalManager.StartLoop(...)

		s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
			Type: discordgo.InteractionResponseChannelMessageWithSource,
			Data: &discordgo.InteractionResponseData{
				Content: fmt.Sprintf("Starting loop for %s at %dms...", id, interval),
			},
		})

		// In real impl: fetch config, start loop

	case "stop":
		id := options[0].Options[0].StringValue()
		looper.GlobalManager.StopLoop(id)

		s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
			Type: discordgo.InteractionResponseChannelMessageWithSource,
			Data: &discordgo.InteractionResponseData{
				Content: fmt.Sprintf("Stopped loop for %s", id),
			},
		})

	case "list":
		// List active loops
		s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
			Type: discordgo.InteractionResponseChannelMessageWithSource,
			Data: &discordgo.InteractionResponseData{
				Content: "List not implemented yet.",
			},
		})
	}
}

func init() {
	commands.Register(WebhookLooperCmd)
}
