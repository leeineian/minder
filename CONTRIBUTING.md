# Contributing to Minder

First off, thank you for considering contributing to Minder! 🎉

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce** the behavior
- **Expected vs actual behavior**
- **Environment details** (OS, Go version, etc.)
- **Logs or error messages** if applicable

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide detailed description** of the proposed functionality
- **Explain why this enhancement would be useful**
- **List any alternatives** you've considered

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Follow the coding style** (see below)
3. **Add tests** for any new functionality
4. **Ensure all tests pass** (`make test`)
5. **Update documentation** if needed
6. **Write clear commit messages**

## Development Setup

### Prerequisites

- Go 1.21 or higher
- Git
- A Discord bot token (for testing)

### Getting Started

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/Minder.git
cd Minder

# Install dependencies
go mod download

# Copy and configure environment
cp .env.example .env
# Edit .env with your Discord token

# Run tests
make test

# Run the bot
make run
```

## Coding Guidelines

### Go Style

- Follow standard Go conventions and idioms
- Use `gofmt` for formatting (run `make fmt`)
- Run `go vet` before committing (run `make lint`)
- Keep functions small and focused
- Write meaningful variable and function names

### Testing

- Write unit tests for new functionality
- Aim for meaningful test coverage
- Use table-driven tests where appropriate
- Mock external dependencies (Discord API, etc.)

### Structured Logging

We use `log/slog` for structured logging:

```go
import "github.com/leeineian/minder/internal/logger"

// Good
logger.Info("User action", "userID", userID, "action", "reminder_set")

// Bad
log.Printf("User %s set a reminder", userID)
```

### Error Handling

- Always handle errors explicitly
- Use `fmt.Errorf` with `%w` for error wrapping
- Log errors with appropriate context

```go
if err := someFunc(); err != nil {
    logger.Error("Failed to execute function", "error", err, "context", value)
    return fmt.Errorf("execute function: %w", err)
}
```

## Commit Messages

- Use present tense ("Add feature" not "Added feature")
- Use imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit first line to 72 characters
- Reference issues and pull requests when relevant

Examples:
```
Add reminder notification feature

- Implement notification daemon
- Add tests for reminder timing
- Update documentation

Fixes #123
```

## Project Structure

```
minder/
├── cmd/minder/          # Main application entry point
├── internal/
│   ├── bot/            # Discord bot logic
│   ├── commands/       # Slash command implementations
│   ├── config/         # Configuration management
│   ├── daemons/        # Background services
│   ├── database/       # Database operations
│   └── logger/         # Structured logging
├── .github/            # CI/CD workflows
└── Makefile           # Build and test commands
```

## Running Tests

```bash
# Run all tests
make test

# Run tests with coverage
make test-coverage

# Run linting
make lint

# Format code
make fmt
```

## Building

```bash
# Build binary
make build

# Run without building
make run

# Build Docker image
make docker-build
```

## Questions?

Feel free to open an issue with your question or reach out to the maintainers.
