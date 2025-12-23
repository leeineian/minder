package reminder

import (
	"fmt"
	"time"

	"github.com/bwmarrin/discordgo"
	"github.com/leeineian/minder/internal/commands"
	"github.com/leeineian/minder/internal/daemons/scheduler"
	"github.com/leeineian/minder/internal/database"
)

var ReminderCmd = &commands.Command{
	Name:        "reminder",
	Description: "Manage your reminders",
	Options: []*discordgo.ApplicationCommandOption{
		{
			Type:        discordgo.ApplicationCommandOptionSubCommand,
			Name:        "set",
			Description: "Set a new reminder",
			Options: []*discordgo.ApplicationCommandOption{
				{
					Type:        discordgo.ApplicationCommandOptionString,
					Name:        "message",
					Description: "What should I remind you about?",
					Required:    true,
				},
				{
					Type:        discordgo.ApplicationCommandOptionString,
					Name:        "when",
					Description: "When? (e.g. 'in 30 mins', '2h', 'tomorrow 9am')",
					Required:    true,
				},
			},
		},
		{
			Type:        discordgo.ApplicationCommandOptionSubCommand,
			Name:        "list",
			Description: "List your active reminders",
		},
	},
	Handler: handleReminder,
}

func handleReminder(s *discordgo.Session, i *discordgo.InteractionCreate) {
	options := i.ApplicationCommandData().Options
	subCmd := options[0].Name

	switch subCmd {
	case "set":
		handleSet(s, i, options[0].Options)
	case "list":
		handleList(s, i)
	}
}

func handleSet(s *discordgo.Session, i *discordgo.InteractionCreate, options []*discordgo.ApplicationCommandInteractionDataOption) {
	message := options[0].StringValue()
	when := options[1].StringValue()

	// Get user ID safely (works in both guild and DM)
	userID := getUserID(i)
	if userID == "" {
		s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
			Type: discordgo.InteractionResponseChannelMessageWithSource,
			Data: &discordgo.InteractionResponseData{
				Content: "❌ Could not identify user",
				Flags:   discordgo.MessageFlagsEphemeral,
			},
		})
		return
	}

	// Parse time (simple implementation - you can add chrono-like parsing)
	dueAt, err := parseTime(when)
	if err != nil {
		s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
			Type: discordgo.InteractionResponseChannelMessageWithSource,
			Data: &discordgo.InteractionResponseData{
				Content: fmt.Sprintf("⚠️ Could not parse time: %v", err),
				Flags:   discordgo.MessageFlagsEphemeral,
			},
		})
		return
	}

	if dueAt.Before(time.Now()) {
		s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
			Type: discordgo.InteractionResponseChannelMessageWithSource,
			Data: &discordgo.InteractionResponseData{
				Content: "⚠️ That time is in the past!",
				Flags:   discordgo.MessageFlagsEphemeral,
			},
		})
		return
	}

	// Validate message length
	if len(message) > 500 {
		s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
			Type: discordgo.InteractionResponseChannelMessageWithSource,
			Data: &discordgo.InteractionResponseData{
				Content: "❌ Message too long (max 500 characters)",
				Flags:   discordgo.MessageFlagsEphemeral,
			},
		})
		return
	}

	// Save to DB
	result, err := database.DB.Exec(
		"INSERT INTO reminders (userId, channelId, message, time, active) VALUES (?, ?, ?, ?, 1)",
		userID,
		i.ChannelID,
		message,
		dueAt.Unix(),
	)
	if err != nil {
		s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
			Type: discordgo.InteractionResponseChannelMessageWithSource,
			Data: &discordgo.InteractionResponseData{
				Content: "❌ Failed to save reminder",
				Flags:   discordgo.MessageFlagsEphemeral,
			},
		})
		return
	}

	id, _ := result.LastInsertId()

	// Schedule
	scheduler.ScheduleReminder(s, userID, i.ChannelID, message, int(id), dueAt)

	s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseChannelMessageWithSource,
		Data: &discordgo.InteractionResponseData{
			Content: fmt.Sprintf("✅ Reminder set for <t:%d:R>", dueAt.Unix()),
			Flags:   discordgo.MessageFlagsEphemeral,
		},
	})
}

func handleList(s *discordgo.Session, i *discordgo.InteractionCreate) {
	userID := getUserID(i)
	if userID == "" {
		s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
			Type: discordgo.InteractionResponseChannelMessageWithSource,
			Data: &discordgo.InteractionResponseData{
				Content: "❌ Could not identify user",
				Flags:   discordgo.MessageFlagsEphemeral,
			},
		})
		return
	}

	rows, err := database.DB.Query(
		"SELECT id, message, time FROM reminders WHERE userId = ? AND active = 1 ORDER BY time ASC",
		userID,
	)
	if err != nil {
		s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
			Type: discordgo.InteractionResponseChannelMessageWithSource,
			Data: &discordgo.InteractionResponseData{
				Content: "❌ Failed to fetch reminders",
				Flags:   discordgo.MessageFlagsEphemeral,
			},
		})
		return
	}
	defer rows.Close()

	var reminders []string
	for rows.Next() {
		var id int
		var message string
		var timeUnix int64
		if err := rows.Scan(&id, &message, &timeUnix); err != nil {
			continue // Skip invalid rows
		}
		reminders = append(reminders, fmt.Sprintf("• [%d] <t:%d:R> - %s", id, timeUnix, message))
	}

	if len(reminders) == 0 {
		s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
			Type: discordgo.InteractionResponseChannelMessageWithSource,
			Data: &discordgo.InteractionResponseData{
				Content: "You have no active reminders.",
				Flags:   discordgo.MessageFlagsEphemeral,
			},
		})
		return
	}

	content := "📋 **Your Reminders:**\n" + joinStrings(reminders, "\n")
	s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseChannelMessageWithSource,
		Data: &discordgo.InteractionResponseData{
			Content: content,
			Flags:   discordgo.MessageFlagsEphemeral,
		},
	})
}

// Simple time parser (supports "in 30m", "2h", etc.)
func parseTime(when string) (time.Time, error) {
	duration, err := time.ParseDuration(when)
	if err == nil {
		return time.Now().Add(duration), nil
	}

	// If not a duration, try parsing as absolute time
	// For now, return an error encouraging duration format
	return time.Time{}, fmt.Errorf("use duration format like '30m', '2h', '1h30m'")
}

func joinStrings(strs []string, sep string) string {
	result := ""
	for i, s := range strs {
		if i > 0 {
			result += sep
		}
		result += s
	}
	return result
}

// getUserID safely extracts user ID from interaction (works in guild and DM)
func getUserID(i *discordgo.InteractionCreate) string {
	if i.Member != nil && i.Member.User != nil {
		return i.Member.User.ID
	}
	if i.User != nil {
		return i.User.ID
	}
	return ""
}

func init() {
	commands.Register(ReminderCmd)
}
