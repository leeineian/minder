.PHONY: run build clean tidy test test-coverage lint fmt fmt-check docker-build docker-run help

# Default help target
help:
	@echo "Available targets:"
	@echo "  run            - Run the bot without building"
	@echo "  build          - Build the bot binary"
	@echo "  clean          - Remove build artifacts"
	@echo "  tidy           - Tidy go.mod dependencies"
	@echo "  test           - Run all tests"
	@echo "  test-coverage  - Run tests with coverage report"
	@echo "  lint           - Run go vet and other linters"
	@echo "  fmt            - Format all Go files"
	@echo "  fmt-check      - Check if files are formatted"
	@echo "  docker-build   - Build Docker image"
	@echo "  docker-run     - Run with docker-compose"

run:
	go run cmd/minder/main.go

build:
	go build -o bin/minder cmd/minder/main.go

clean:
	rm -rf bin/ coverage.* *.test

tidy:
	go mod tidy

test:
	go test -v ./...

test-coverage:
	go test -v -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report generated: coverage.html"

lint:
	go vet ./...
	gofmt -l .

fmt:
	gofmt -w .

fmt-check:
	@if [ -n "$$(gofmt -l .)" ]; then \
		echo "The following files are not formatted:"; \
		gofmt -l .; \
		exit 1; \
	fi

docker-build:
	docker build -t minder:latest .

docker-run:
	docker-compose up -d
