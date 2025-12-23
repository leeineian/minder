package config_test

import (
	"os"
	"testing"

	"github.com/leeineian/minder/internal/config"
)

func TestLoad(t *testing.T) {
	// Save original environment
	originalToken := os.Getenv("DISCORD_TOKEN")
	originalClientID := os.Getenv("CLIENT_ID")

	defer func() {
		// Restore environment
		os.Setenv("DISCORD_TOKEN", originalToken)
		os.Setenv("CLIENT_ID", originalClientID)
	}()

	t.Run("successful load", func(t *testing.T) {
		os.Setenv("DISCORD_TOKEN", "test_token_123")
		os.Setenv("CLIENT_ID", "test_client_id")

		cfg, err := config.Load()
		if err != nil {
			t.Fatalf("Expected no error, got: %v", err)
		}

		if cfg.Token != "test_token_123" {
			t.Errorf("Expected token 'test_token_123', got '%s'", cfg.Token)
		}

		if cfg.ClientId != "test_client_id" {
			t.Errorf("Expected clientId 'test_client_id', got '%s'", cfg.ClientId)
		}
	})

	t.Run("missing required token", func(t *testing.T) {
		os.Unsetenv("DISCORD_TOKEN")

		_, err := config.Load()
		if err == nil {
			t.Error("Expected error for missing DISCORD_TOKEN")
		}
	})

	t.Run("default values", func(t *testing.T) {
		os.Setenv("DISCORD_TOKEN", "test_token")
		os.Unsetenv("DATABASE_PATH")
		os.Unsetenv("LOG_LEVEL")
		os.Unsetenv("NODE_ENV")

		cfg, err := config.Load()
		if err != nil {
			t.Fatalf("Unexpected error: %v", err)
		}

		if cfg.DatabasePath != "./data.db" {
			t.Errorf("Expected default database path './data.db', got '%s'", cfg.DatabasePath)
		}

		if cfg.LogLevel != "info" {
			t.Errorf("Expected default log level 'info', got '%s'", cfg.LogLevel)
		}

		if cfg.Environment != "development" {
			t.Errorf("Expected default environment 'development', got '%s'", cfg.Environment)
		}
	})

	t.Run("custom values", func(t *testing.T) {
		os.Setenv("DISCORD_TOKEN", "custom_token")
		os.Setenv("GUILD_ID", "123456789")
		os.Setenv("OWNER_ID", "987654321")
		os.Setenv("DATABASE_PATH", "/custom/path/data.db")
		os.Setenv("LOG_LEVEL", "debug")
		os.Setenv("NODE_ENV", "production")
		os.Setenv("TAVILY_API_KEY", "tavily_key_123")

		cfg, err := config.Load()
		if err != nil {
			t.Fatalf("Unexpected error: %v", err)
		}

		if cfg.GuildId != "123456789" {
			t.Errorf("Expected GuildId '123456789', got '%s'", cfg.GuildId)
		}

		if cfg.OwnerId != "987654321" {
			t.Errorf("Expected OwnerId '987654321', got '%s'", cfg.OwnerId)
		}

		if cfg.DatabasePath != "/custom/path/data.db" {
			t.Errorf("Expected custom database path, got '%s'", cfg.DatabasePath)
		}

		if cfg.LogLevel != "debug" {
			t.Errorf("Expected log level 'debug', got '%s'", cfg.LogLevel)
		}

		if cfg.Environment != "production" {
			t.Errorf("Expected environment 'production', got '%s'", cfg.Environment)
		}

		if cfg.TavilyKey != "tavily_key_123" {
			t.Errorf("Expected TavilyKey 'tavily_key_123', got '%s'", cfg.TavilyKey)
		}
	})
}
