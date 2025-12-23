package bot

import (
	"log"

	"github.com/bwmarrin/discordgo"
	"github.com/leeineian/minder/internal/commands"
)

func InteractionHandler(s *discordgo.Session, i *discordgo.InteractionCreate) {
	switch i.Type {
	case discordgo.InteractionApplicationCommand:
		if cmd, ok := commands.Registry[i.ApplicationCommandData().Name]; ok {
			cmd.Handler(s, i)
		} else {
			log.Printf("Unknown command: %s", i.ApplicationCommandData().Name)
		}
	case discordgo.InteractionMessageComponent:
		log.Printf("Component interaction: %s", i.MessageComponentData().CustomID)
	}
}
