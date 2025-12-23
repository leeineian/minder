package logger_test

import (
	"bytes"
	"log/slog"
	"os"
	"strings"
	"testing"

	"github.com/leeineian/minder/internal/logger"
)

func TestInit(t *testing.T) {
	tests := []struct {
		name     string
		logLevel string
		expected slog.Level
	}{
		{"debug level", "debug", slog.LevelDebug},
		{"info level", "info", slog.LevelInfo},
		{"warn level", "warn", slog.LevelWarn},
		{"warning level", "warning", slog.LevelWarn},
		{"error level", "error", slog.LevelError},
		{"default level", "invalid", slog.LevelInfo},
		{"empty level", "", slog.LevelInfo},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			logger.Init(tt.logLevel)
			if logger.Log == nil {
				t.Fatal("Logger was not initialized")
			}
		})
	}
}

func TestLoggingFunctions(t *testing.T) {
	// Initialize logger
	logger.Init("debug")

	// These tests just verify the functions don't panic
	t.Run("Debug", func(t *testing.T) {
		defer func() {
			if r := recover(); r != nil {
				t.Errorf("Debug panicked: %v", r)
			}
		}()
		logger.Debug("test debug message", "key", "value")
	})

	t.Run("Info", func(t *testing.T) {
		defer func() {
			if r := recover(); r != nil {
				t.Errorf("Info panicked: %v", r)
			}
		}()
		logger.Info("test info message", "key", "value")
	})

	t.Run("Warn", func(t *testing.T) {
		defer func() {
			if r := recover(); r != nil {
				t.Errorf("Warn panicked: %v", r)
			}
		}()
		logger.Warn("test warn message", "key", "value")
	})

	t.Run("Error", func(t *testing.T) {
		defer func() {
			if r := recover(); r != nil {
				t.Errorf("Error panicked: %v", r)
			}
		}()
		logger.Error("test error message", "key", "value")
	})
}

func TestWithContext(t *testing.T) {
	logger.Init("info")

	contextLogger := logger.WithContext("component", "test", "requestID", "12345")
	if contextLogger == nil {
		t.Fatal("WithContext returned nil")
	}

	// Verify it's a different logger instance
	if contextLogger == logger.Log {
		t.Error("WithContext should return a new logger instance")
	}
}

func TestProductionMode(t *testing.T) {
	// Set environment to production
	originalEnv := os.Getenv("ENVIRONMENT")
	defer os.Setenv("ENVIRONMENT", originalEnv)

	os.Setenv("ENVIRONMENT", "production")
	logger.Init("info")

	// Test that it doesn't panic in production mode
	logger.Info("Production test", "test", true)
}

func TestDevelopmentMode(t *testing.T) {
	// Unset ENVIRONMENT to use development mode
	originalEnv := os.Getenv("ENVIRONMENT")
	defer func() {
		if originalEnv != "" {
			os.Setenv("ENVIRONMENT", originalEnv)
		} else {
			os.Unsetenv("ENVIRONMENT")
		}
	}()

	os.Unsetenv("ENVIRONMENT")
	logger.Init("debug")

	// Test that it doesn't panic in development mode
	logger.Debug("Development test", "debug", true)
}

func TestLogOutput(t *testing.T) {
	// Capture stdout
	old := os.Stdout
	r, w, _ := os.Pipe()
	os.Stdout = w

	logger.Init("info")
	logger.Info("test message", "key", "value")

	w.Close()
	os.Stdout = old

	var buf bytes.Buffer
	buf.ReadFrom(r)
	output := buf.String()

	if !strings.Contains(output, "test message") {
		t.Errorf("Expected output to contain 'test message', got: %s", output)
	}
}
