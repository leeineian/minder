FROM golang:1.23-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git gcc musl-dev

# Set working directory
WORKDIR /build

# Copy dependency files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the binary
RUN CGO_ENABLED=1 GOOS=linux go build -a -installsuffix cgo -o minder cmd/minder/main.go

# Final stage
FROM alpine:latest

# Install runtime dependencies
RUN apk --no-cache add ca-certificates tzdata

# Create non-root user
RUN addgroup -g 1000 minder && \
    adduser -D -u 1000 -G minder minder

# Set working directory
WORKDIR /app

# Copy binary from builder
COPY --from=builder /build/minder /app/minder

# Copy .env.example for reference
COPY .env.example /app/

# Create data directory for SQLite
RUN mkdir -p /app/data && \
    chown -R minder:minder /app

# Switch to non-root user
USER minder

# Expose port (if needed for health checks)
EXPOSE 8080

# Start the bot
CMD ["/app/minder"]
