FROM oven/bun:1-alpine

# Set working directory
WORKDIR /app

# Copy dependency files
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install --frozen-lockfile --production

# Copy source code
COPY src ./src
COPY .env.example ./

# Create data directory for SQLite
RUN mkdir -p /app/data && \
    chown -R bun:bun /app

# Switch to non-root user
USER bun

# Set environment
ENV NODE_ENV=production

# Start the bot
CMD ["bun", "src/start.js"]
