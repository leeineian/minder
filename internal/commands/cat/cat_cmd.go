package cat

import (
	"github.com/bwmarrin/discordgo"
	"github.com/leeineian/minder/internal/commands"
)

var SayCmd = &commands.Command{
	Name:        "cat",
	Description: "Cat commands",
	Options: []*discordgo.ApplicationCommandOption{
		{
			Type:        discordgo.ApplicationCommandOptionSubCommand,
			Name:        "say",
			Description: "Make the bot say something",
			Options: []*discordgo.ApplicationCommandOption{
				{
					Type:        discordgo.ApplicationCommandOptionString,
					Name:        "message",
					Description: "What should the bot say?",
					Required:    true,
				},
			},
		},
	},
	Handler: handleCat,
}

func handleCat(s *discordgo.Session, i *discordgo.InteractionCreate) {
	options := i.ApplicationCommandData().Options
	if len(options) == 0 {
		return
	}

	subCmd := options[0].Name

	switch subCmd {
	case "say":
		if len(options[0].Options) == 0 {
			return
		}

		message := options[0].Options[0].StringValue()

		// Validate message
		if len(message) == 0 {
			s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
				Type: discordgo.InteractionResponseChannelMessageWithSource,
				Data: &discordgo.InteractionResponseData{
					Content: "❌ Message cannot be empty",
					Flags:   discordgo.MessageFlagsEphemeral,
				},
			})
			return
		}

		if len(message) > 2000 {
			s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
				Type: discordgo.InteractionResponseChannelMessageWithSource,
				Data: &discordgo.InteractionResponseData{
					Content: "❌ Message too long (max 2000 characters)",
					Flags:   discordgo.MessageFlagsEphemeral,
				},
			})
			return
		}

		// Respond to make the slash command invisible
		err := s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
			Type: discordgo.InteractionResponseDeferredChannelMessageWithSource,
			Data: &discordgo.InteractionResponseData{
				Flags: discordgo.MessageFlagsEphemeral,
			},
		})
		if err != nil {
			return
		}

		// Send the message
		_, err = s.ChannelMessageSend(i.ChannelID, message)
		if err != nil {
			s.InteractionResponseEdit(i.Interaction, &discordgo.WebhookEdit{
				Content: ptrString("❌ Failed to send message"),
			})
			return
		}

		// Delete the deferred response
		s.InteractionResponseDelete(i.Interaction)
	}
}

func ptrString(s string) *string {
	return &s
}

func init() {
	commands.Register(SayCmd)
}
