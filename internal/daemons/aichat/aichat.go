package aichat

import (
	"strings"

	"github.com/bwmarrin/discordgo"
	"github.com/leeineian/minder/internal/logger"
)

var botID string

// Start registers the AI chat message listener
func Start(s *discordgo.Session) {
	botID = s.State.User.ID

	s.AddHandler(onMessage)
	logger.Info("AI chat listener started")
}

func onMessage(s *discordgo.Session, m *discordgo.MessageCreate) {
	// Ignore bot messages
	if m.Author.ID == botID {
		return
	}

	// Check if bot is mentioned
	mentioned := false
	for _, user := range m.Mentions {
		if user.ID == botID {
			mentioned = true
			break
		}
	}

	if !mentioned {
		return
	}

	// Simple echo response (placeholder for real AI)
	content := strings.ReplaceAll(m.Content, "<@"+botID+">", "")
	content = strings.TrimSpace(content)

	if content == "" {
		return
	}

	// In a real implementation, call AI API here
	response := "🤖 I hear you! (AI chat not fully implemented yet)"

	s.ChannelMessageSend(m.ChannelID, response)
}
