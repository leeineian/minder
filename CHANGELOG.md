# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive unit test suite for core packages
- GitHub Actions CI/CD pipeline
  - Automated testing across Go 1.21 and 1.23
  - Linting with go vet, gofmt, and golangci-lint
  - Docker image building and validation
  - CodeQL security scanning
- Dependabot configuration for automated dependency updates
- Enhanced Makefile with test, lint, and coverage targets
- CONTRIBUTING.md with development guidelines
- Structured logging using log/slog
  - JSON output in production mode
  - Text output in development mode
  - Configurable log levels

### Changed
- **BREAKING**: Complete migration from Bun/JavaScript to Go
  - Rewritten all bot logic in Go
  - New multi-stage Dockerfile for Go
  - Updated docker-compose.yml for Go binary
- Migrated from standard `log` to structured `log/slog`
- Enhanced .gitignore for better coverage
- Improved error handling with context-rich logging

### Fixed
- Go module version (was 1.25.5, now 1.23)
- Code formatting issues (gofmt compliance)
- Docker configuration for Go deployment

## [2.0.0] - 2025-12-23

### Added
- Complete Go rewrite of the Discord bot
- Slash command support
  - `/reminder` - Set and manage reminders
  - `/cat say` - Make the bot say things
  - `/ai chat` - AI chat functionality
  - `/debug webhook-looper` - Webhook stress testing
- Background daemons
  - Status rotator
  - Role color rotator
  - AI chat listener
  - Reminder scheduler
  - Webhook looper
- SQLite database with pure Go driver
- Standard Go project layout (cmd/, internal/)

### Changed
- Migrated from Bun to Go 1.23
- Replaced discord.js with discordgo
- New build system using Go modules

### Removed
- All JavaScript/TypeScript code
- Node.js/Bun dependencies
- Old build system

## [1.0.0] - Previous Bun/JavaScript Implementation

Legacy version before Go migration. See git history for details.

---

## Version Guidelines

- **Major version (X.0.0)**: Breaking changes, major rewrites
- **Minor version (x.Y.0)**: New features, backwards compatible
- **Patch version (x.y.Z)**: Bug fixes, minor improvements

[Unreleased]: https://github.com/leeineian/minder/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/leeineian/minder/releases/tag/v2.0.0
