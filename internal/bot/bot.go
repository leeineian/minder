package bot

import (
	"os"
	"os/signal"
	"syscall"

	"github.com/bwmarrin/discordgo"
	"github.com/leeineian/minder/internal/commands"
	_ "github.com/leeineian/minder/internal/commands/ai"       // Register AI commands
	_ "github.com/leeineian/minder/internal/commands/cat"      // Register cat commands
	_ "github.com/leeineian/minder/internal/commands/debug"    // Register debug commands
	_ "github.com/leeineian/minder/internal/commands/reminder" // Register reminder commands
	"github.com/leeineian/minder/internal/config"
	"github.com/leeineian/minder/internal/daemons/aichat"
	"github.com/leeineian/minder/internal/daemons/looper"
	"github.com/leeineian/minder/internal/daemons/rolecolor"
	"github.com/leeineian/minder/internal/daemons/scheduler"
	"github.com/leeineian/minder/internal/daemons/status"
	"github.com/leeineian/minder/internal/database"
	"github.com/leeineian/minder/internal/logger"
)

func Start(cfg *config.Config) error {
	// 0. Initialize Database
	logger.Info("Initializing database", "path", cfg.DatabasePath)
	if err := database.Init(cfg.DatabasePath); err != nil {
		logger.Error("Failed to initialize database", "error", err)
		return err
	}
	defer database.Close()

	if err := database.ExecuteMigration(); err != nil {
		logger.Warn("Database migration warning", "error", err)
	}

	// 0.5 Load Daemons
	if err := looper.GlobalManager.LoadFromDB(); err != nil {
		logger.Warn("Failed to load loops from database", "error", err)
	}

	// 1. Create Session
	logger.Info("Creating Discord session")
	s, err := discordgo.New("Bot " + cfg.Token)
	if err != nil {
		logger.Error("Failed to create Discord session", "error", err)
		return err
	}

	// 2. Register Handlers
	s.AddHandler(func(s *discordgo.Session, r *discordgo.Ready) {
		logger.Info("Bot logged in successfully",
			"username", s.State.User.Username,
			"discriminator", s.State.User.Discriminator,
			"id", s.State.User.ID)
	})

	s.AddHandler(InteractionHandler)

	// 3. Open Connection
	logger.Info("Opening Discord connection")
	if err := s.Open(); err != nil {
		logger.Error("Failed to open Discord connection", "error", err)
		return err
	}
	defer s.Close()

	// 4. Register Commands
	logger.Info("Syncing Discord commands")
	if err := commands.SyncCommands(s, cfg); err != nil {
		logger.Warn("Failed to sync commands", "error", err)
	}

	// 5. Start Daemons
	logger.Info("Starting daemons")
	status.Start(s)
	aichat.Start(s)
	rolecolor.Start(s)
	if err := scheduler.RestoreReminders(s); err != nil {
		logger.Warn("Failed to restore reminders", "error", err)
	}

	// 6. Wait for Interrupt
	logger.Info("Bot is now running. Press Ctrl+C to exit")
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	<-stop

	logger.Info("Gracefully shutting down...")
	return nil
}
