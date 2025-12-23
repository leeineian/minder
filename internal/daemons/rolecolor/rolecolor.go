package rolecolor

import (
	"math/rand"
	"time"

	"github.com/bwmarrin/discordgo"
	"github.com/leeineian/minder/internal/logger"
)

var (
	guildID string
	roleID  string
)

// Init sets up the role color rotator configuration
func Init(guild, role string) {
	guildID = guild
	roleID = role
}

// Start begins the role color rotation daemon
func Start(s *discordgo.Session) {
	if guildID == "" || roleID == "" {
		logger.Info("Role color rotator not configured, skipping")
		return
	}

	go func() {
		ticker := time.NewTicker(10 * time.Minute)
		defer ticker.Stop()

		for range ticker.C {
			color := rand.Intn(0xFFFFFF)

			_, err := s.GuildRoleEdit(guildID, roleID, &discordgo.RoleParams{
				Color: &color,
			})

			if err != nil {
				logger.Warn("Failed to update role color", "error", err, "guildID", guildID, "roleID", roleID)
			} else {
				logger.Debug("Updated role color", "color", color, "guildID", guildID, "roleID", roleID)
			}
		}
	}()

	logger.Info("Role color rotator started", "guildID", guildID, "roleID", roleID)
}
