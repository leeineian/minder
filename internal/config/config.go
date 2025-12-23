package config

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Token        string
	ClientId     string
	GuildId      string
	OwnerId      string
	DatabasePath string
	LogLevel     string
	Environment  string
	TavilyKey    string
}

func Load() (*Config, error) {
	// wrapper to load .env file if it exists
	_ = godotenv.Load()

	cfg := &Config{
		Token:        os.Getenv("DISCORD_TOKEN"),
		ClientId:     os.Getenv("CLIENT_ID"),
		GuildId:      os.Getenv("GUILD_ID"),
		OwnerId:      os.Getenv("OWNER_ID"),
		DatabasePath: os.Getenv("DATABASE_PATH"),
		LogLevel:     os.Getenv("LOG_LEVEL"),
		Environment:  os.Getenv("NODE_ENV"),
		TavilyKey:    os.Getenv("TAVILY_API_KEY"),
	}

	if cfg.Token == "" {
		return nil, fmt.Errorf("DISCORD_TOKEN is required")
	}
	if cfg.DatabasePath == "" {
		cfg.DatabasePath = "./data.db"
	}
	if cfg.LogLevel == "" {
		cfg.LogLevel = "info"
	}
	if cfg.Environment == "" {
		cfg.Environment = "development"
	}

	return cfg, nil
}
