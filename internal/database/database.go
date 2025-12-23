package database

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/leeineian/minder/internal/logger"
	_ "modernc.org/sqlite" // Pure Go SQLite driver
)

var DB *sql.DB

func Init(path string) error {
	var err error
	DB, err = sql.Open("sqlite", path)
	if err != nil {
		return fmt.Errorf("failed to open database: %w", err)
	}

	// Set connection pool settings
	DB.SetMaxOpenConns(25)
	DB.SetMaxIdleConns(5)
	DB.SetConnMaxLifetime(5 * time.Minute)

	if err := DB.Ping(); err != nil {
		return fmt.Errorf("failed to ping database: %w", err)
	}

	logger.Info("Database connected",
		"path", path,
		"maxOpenConns", 25,
		"maxIdleConns", 5)
	return nil
}

func Close() {
	if DB != nil {
		DB.Close()
	}
}

// ExecuteMigration runs the initial schema setup
func ExecuteMigration() error {
	query := `
	CREATE TABLE IF NOT EXISTS reminders (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		userId TEXT,
		channelId TEXT,
		message TEXT,
		time INTEGER,
		active BOOLEAN DEFAULT 1
	);
	
	CREATE TABLE IF NOT EXISTS webhook_loops (
		channelId TEXT PRIMARY KEY,
		config TEXT,
		threads TEXT
	);

    CREATE TABLE IF NOT EXISTS kv_store (
        key TEXT PRIMARY KEY,
        value TEXT
    );
	`
	_, err := DB.Exec(query)
	return err
}
