package commands

import (
	"github.com/bwmarrin/discordgo"
	"github.com/leeineian/minder/internal/config"
	"github.com/leeineian/minder/internal/logger"
)

// Command definition
type Command struct {
	Name        string
	Description string
	Options     []*discordgo.ApplicationCommandOption
	Handler     func(s *discordgo.Session, i *discordgo.InteractionCreate)
}

// Registry stores all available commands
var Registry = make(map[string]*Command)

// Register adds a command to the registry
func Register(cmd *Command) {
	Registry[cmd.Name] = cmd
}

// SyncCommands registers commands with Discord
func SyncCommands(s *discordgo.Session, cfg *config.Config) error {
	logger.Info("Syncing commands", "count", len(Registry), "guildID", cfg.GuildId)

	cmds := make([]*discordgo.ApplicationCommand, 0, len(Registry))
	for _, cmd := range Registry {
		cmds = append(cmds, &discordgo.ApplicationCommand{
			Name:        cmd.Name,
			Description: cmd.Description,
			Options:     cmd.Options,
		})
	}

	// Bulk overwrite commands (for guild or global)
	// If GuildID is set, use it for instant updates
	if cfg.GuildId != "" {
		_, err := s.ApplicationCommandBulkOverwrite(s.State.User.ID, cfg.GuildId, cmds)
		return err
	}

	_, err := s.ApplicationCommandBulkOverwrite(s.State.User.ID, "", cmds)
	return err
}
