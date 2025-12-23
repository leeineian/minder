package status

import (
	"math/rand"
	"time"

	"github.com/bwmarrin/discordgo"
	"github.com/leeineian/minder/internal/logger"
)

var statuses = []string{
	"with webhooks",
	"Go routines",
	"/reminder | /cat",
	"stress testing Discord",
}

// Start begins the status rotation daemon
func Start(s *discordgo.Session) {
	// Initialize random seed
	rand.Seed(time.Now().UnixNano())

	go func() {
		ticker := time.NewTicker(30 * time.Second)
		defer ticker.Stop()

		for range ticker.C {
			status := statuses[rand.Intn(len(statuses))]
			err := s.UpdateGameStatus(0, status)
			if err != nil {
				logger.Warn("Failed to update status", "error", err, "status", status)
			}
		}
	}()

	logger.Info("Status rotator started")
}
