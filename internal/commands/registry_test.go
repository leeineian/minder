package commands_test

import (
	"testing"

	"github.com/bwmarrin/discordgo"
	"github.com/leeineian/minder/internal/commands"
)

func TestRegister(t *testing.T) {
	// Clear registry for clean test
	commands.Registry = make(map[string]*commands.Command)

	// Create a test command
	testCmd := &commands.Command{
		Name:        "testcmd",
		Description: "A test command",
		Options:     nil,
		Handler:     func(s *discordgo.Session, i *discordgo.InteractionCreate) {},
	}

	// Register the command
	commands.Register(testCmd)

	// Verify it's in the registry
	if _, exists := commands.Registry["testcmd"]; !exists {
		t.Error("Command was not registered")
	}

	// Verify the command details
	registered := commands.Registry["testcmd"]
	if registered.Name != "testcmd" {
		t.Errorf("Expected name 'testcmd', got '%s'", registered.Name)
	}

	if registered.Description != "A test command" {
		t.Errorf("Expected description 'A test command', got '%s'", registered.Description)
	}
}

func TestRegisterMultiple(t *testing.T) {
	// Clear registry
	commands.Registry = make(map[string]*commands.Command)

	// Register multiple commands
	for i := 0; i < 5; i++ {
		cmd := &commands.Command{
			Name:        string(rune('a' + i)),
			Description: "Command " + string(rune('a'+i)),
			Handler:     func(s *discordgo.Session, i *discordgo.InteractionCreate) {},
		}
		commands.Register(cmd)
	}

	// Verify count
	if len(commands.Registry) != 5 {
		t.Errorf("Expected 5 commands, got %d", len(commands.Registry))
	}
}

func TestRegisterOverwrite(t *testing.T) {
	// Clear registry
	commands.Registry = make(map[string]*commands.Command)

	// Register initial command
	cmd1 := &commands.Command{
		Name:        "overwrite",
		Description: "First version",
		Handler:     func(s *discordgo.Session, i *discordgo.InteractionCreate) {},
	}
	commands.Register(cmd1)

	// Register command with same name
	cmd2 := &commands.Command{
		Name:        "overwrite",
		Description: "Second version",
		Handler:     func(s *discordgo.Session, i *discordgo.InteractionCreate) {},
	}
	commands.Register(cmd2)

	// Verify only one command exists
	if len(commands.Registry) != 1 {
		t.Errorf("Expected 1 command, got %d", len(commands.Registry))
	}

	// Verify it's the second version
	registered := commands.Registry["overwrite"]
	if registered.Description != "Second version" {
		t.Errorf("Expected description 'Second version', got '%s'", registered.Description)
	}
}
