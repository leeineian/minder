package database_test

import (
	"os"
	"testing"

	"github.com/leeineian/minder/internal/database"
	"github.com/leeineian/minder/internal/logger"
)

func TestMain(m *testing.M) {
	// Initialize logger for tests
	logger.Init("error")
	os.Exit(m.Run())
}

func TestInit(t *testing.T) {
	// Create temporary database path
	tmpFile := t.TempDir() + "/test.db"

	// Test successful initialization
	err := database.Init(tmpFile)
	if err != nil {
		t.Fatalf("Failed to initialize database: %v", err)
	}
	defer database.Close()

	// Verify database connection
	if database.DB == nil {
		t.Fatal("Database connection is nil")
	}

	// Test ping
	err = database.DB.Ping()
	if err != nil {
		t.Fatalf("Failed to ping database: %v", err)
	}
}

func TestExecuteMigration(t *testing.T) {
	// Create temporary database
	tmpFile := t.TempDir() + "/test_migration.db"

	err := database.Init(tmpFile)
	if err != nil {
		t.Fatalf("Failed to initialize database: %v", err)
	}
	defer database.Close()

	// Run migration
	err = database.ExecuteMigration()
	if err != nil {
		t.Fatalf("Failed to execute migration: %v", err)
	}

	// Verify tables exist
	tables := []string{"reminders", "webhook_loops", "kv_store"}
	for _, table := range tables {
		var name string
		query := "SELECT name FROM sqlite_master WHERE type='table' AND name=?"
		err := database.DB.QueryRow(query, table).Scan(&name)
		if err != nil {
			t.Errorf("Table %s does not exist: %v", table, err)
		}
	}
}

func TestClose(t *testing.T) {
	// Create temporary database
	tmpFile := t.TempDir() + "/test_close.db"

	err := database.Init(tmpFile)
	if err != nil {
		t.Fatalf("Failed to initialize database: %v", err)
	}

	// Close database
	database.Close()

	// Attempting to ping should fail after close
	if database.DB != nil {
		err = database.DB.Ping()
		if err == nil {
			t.Error("Expected error when pinging closed database")
		}
	}
}

func TestConcurrentAccess(t *testing.T) {
	// Create temporary database
	tmpFile := t.TempDir() + "/test_concurrent.db"

	err := database.Init(tmpFile)
	if err != nil {
		t.Fatalf("Failed to initialize database: %v", err)
	}
	defer database.Close()

	// Enable WAL mode for better concurrency
	_, err = database.DB.Exec("PRAGMA journal_mode=WAL;")
	if err != nil {
		t.Fatalf("Failed to enable WAL mode: %v", err)
	}

	err = database.ExecuteMigration()
	if err != nil {
		t.Fatalf("Failed to execute migration: %v", err)
	}

	// Test concurrent writes with proper synchronization
	done := make(chan bool, 10)
	errors := make(chan error, 10)

	for i := 0; i < 10; i++ {
		go func(id int) {
			_, err := database.DB.Exec(
				"INSERT INTO kv_store (key, value) VALUES (?, ?)",
				string(rune('a'+id)),
				string(rune('A'+id)),
			)
			if err != nil {
				errors <- err
			}
			done <- true
		}(i)
	}

	// Wait for all goroutines
	for i := 0; i < 10; i++ {
		<-done
	}
	close(errors)

	// Check for errors (some may fail due to locking, which is ok)
	errorCount := 0
	for err := range errors {
		errorCount++
		t.Logf("Concurrent write error (expected with SQLite): %v", err)
	}

	// Verify at least some writes succeeded
	var count int
	err = database.DB.QueryRow("SELECT COUNT(*) FROM kv_store").Scan(&count)
	if err != nil {
		t.Fatalf("Failed to count rows: %v", err)
	}

	if count == 0 {
		t.Error("No rows were inserted during concurrent test")
	}

	t.Logf("Successfully inserted %d/10 rows (some failures expected with SQLite)", count)
}
