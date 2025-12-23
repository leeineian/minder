package ai

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/bwmarrin/discordgo"
	"github.com/leeineian/minder/internal/commands"
	"github.com/leeineian/minder/internal/config"
)

var AiCmd = &commands.Command{
	Name:        "ai",
	Description: "Talk to AI",
	Options: []*discordgo.ApplicationCommandOption{
		{
			Type:        discordgo.ApplicationCommandOptionSubCommand,
			Name:        "chat",
			Description: "Chat with AI",
			Options: []*discordgo.ApplicationCommandOption{
				{
					Type:        discordgo.ApplicationCommandOptionString,
					Name:        "message",
					Description: "Your message",
					Required:    true,
				},
			},
		},
	},
	Handler: handleAI,
}

type ChatRequest struct {
	Model    string    `json:"model"`
	Messages []Message `json:"messages"`
}

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type ChatResponse struct {
	Choices []struct {
		Message Message `json:"message"`
	} `json:"choices"`
}

var cfg *config.Config

func SetConfig(c *config.Config) {
	cfg = c
}

func handleAI(s *discordgo.Session, i *discordgo.InteractionCreate) {
	options := i.ApplicationCommandData().Options
	if len(options) == 0 {
		return
	}

	subCmd := options[0].Name
	if subCmd != "chat" {
		return
	}

	userMsg := options[0].Options[0].StringValue()

	// Defer to allow time for API call
	s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseDeferredChannelMessageWithSource,
	})

	// Call AI API
	response, err := callAI(userMsg)
	if err != nil {
		s.InteractionResponseEdit(i.Interaction, &discordgo.WebhookEdit{
			Content: ptrString(fmt.Sprintf("❌ AI Error: %v", err)),
		})
		return
	}

	s.InteractionResponseEdit(i.Interaction, &discordgo.WebhookEdit{
		Content: ptrString(response),
	})
}

func callAI(userMessage string) (string, error) {
	// Skip if no API key
	if cfg == nil || cfg.TavilyKey == "" {
		return "⚠️ AI feature not configured (missing API key)", nil
	}

	reqBody := ChatRequest{
		Model: "gpt-3.5-turbo",
		Messages: []Message{
			{Role: "system", Content: "You are a helpful assistant."},
			{Role: "user", Content: userMessage},
		},
	}

	bodyBytes, _ := json.Marshal(reqBody)

	// Use LLM7 endpoint if configured
	endpoint := "https://api.openai.com/v1/chat/completions"
	// In a real implementation, use the configured endpoint

	req, err := http.NewRequest("POST", endpoint, bytes.NewBuffer(bodyBytes))
	if err != nil {
		return "", err
	}

	req.Header.Set("Content-Type", "application/json")
	// Note: Would need proper API key here

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	var chatResp ChatResponse
	if err := json.Unmarshal(body, &chatResp); err != nil {
		return "", err
	}

	if len(chatResp.Choices) > 0 {
		return chatResp.Choices[0].Message.Content, nil
	}

	return "No response from AI", nil
}

func ptrString(s string) *string {
	return &s
}

func init() {
	commands.Register(AiCmd)
}
