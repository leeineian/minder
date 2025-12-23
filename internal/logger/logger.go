package logger

import (
	"log/slog"
	"os"
	"strings"
)

var Log *slog.Logger

// Init initializes the global logger based on the provided log level
func Init(logLevel string) {
	level := parseLogLevel(logLevel)

	// Create handler options
	opts := &slog.HandlerOptions{
		Level: level,
	}

	// Use JSON handler for production, text for development
	var handler slog.Handler
	if os.Getenv("ENVIRONMENT") == "production" {
		handler = slog.NewJSONHandler(os.Stdout, opts)
	} else {
		handler = slog.NewTextHandler(os.Stdout, opts)
	}

	Log = slog.New(handler)
	slog.SetDefault(Log)
}

// parseLogLevel converts string log level to slog.Level
func parseLogLevel(level string) slog.Level {
	switch strings.ToLower(level) {
	case "debug":
		return slog.LevelDebug
	case "info":
		return slog.LevelInfo
	case "warn", "warning":
		return slog.LevelWarn
	case "error":
		return slog.LevelError
	default:
		return slog.LevelInfo
	}
}

// WithContext returns a logger with context fields
func WithContext(args ...any) *slog.Logger {
	return Log.With(args...)
}

// Debug logs a debug message
func Debug(msg string, args ...any) {
	Log.Debug(msg, args...)
}

// Info logs an info message
func Info(msg string, args ...any) {
	Log.Info(msg, args...)
}

// Warn logs a warning message
func Warn(msg string, args ...any) {
	Log.Warn(msg, args...)
}

// Error logs an error message
func Error(msg string, args ...any) {
	Log.Error(msg, args...)
}
