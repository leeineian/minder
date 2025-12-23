package debug

import (
	"log"
	"os"
	"time"

	"github.com/bwmarrin/discordgo"
	"github.com/leeineian/minder/internal/commands"
)

var ShutdownCmd = &commands.Command{
	Name:        "shutdown",
	Description: "Shutdown the bot (Owner only)",
	Options:     []*discordgo.ApplicationCommandOption{},
	Handler:     handleShutdown,
}

func handleShutdown(s *discordgo.Session, i *discordgo.InteractionCreate) {
	// Respond immediately
	err := s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseChannelMessageWithSource,
		Data: &discordgo.InteractionResponseData{
			Content: "🛑 Shutting down...",
			Flags:   discordgo.MessageFlagsEphemeral,
		},
	})

	if err != nil {
		log.Printf("Failed to respond to shutdown: %v", err)
	}

	// Graceful shutdown with delay
	go func() {
		time.Sleep(1 * time.Second) // Give time for response to send
		log.Println("Shutdown initiated by command")
		s.Close()
		os.Exit(0)
	}()
}

func init() {
	commands.Register(ShutdownCmd)
}
