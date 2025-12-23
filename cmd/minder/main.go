package main

import (
	"github.com/leeineian/minder/internal/bot"
	"github.com/leeineian/minder/internal/config"
	"github.com/leeineian/minder/internal/logger"
)

func main() {
	// 1. Load Config
	cfg, err := config.Load()
	if err != nil {
		logger.Init("error") // Initialize with basic logging for errors
		logger.Error("Failed to load config", "error", err)
		return
	}

	// 2. Initialize Logger
	logger.Init(cfg.LogLevel)
	logger.Info("Minder bot starting", "logLevel", cfg.LogLevel, "environment", cfg.Environment)

	// 3. Start Bot
	if err := bot.Start(cfg); err != nil {
		logger.Error("Bot crashed", "error", err)
	}
}
