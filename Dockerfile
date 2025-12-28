# ==============================================================================
# INTELLIGENT INVOICE MEMORY AGENT
# Dockerfile for Render Deployment
# ==============================================================================

# Use Node.js 18 slim as base image
FROM node:18-slim

# Set working directory
WORKDIR /app

# Install build dependencies for better-sqlite3
# better-sqlite3 requires native compilation
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files first for better Docker layer caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build TypeScript to JavaScript
RUN npm run build

# Create data directory (will be overridden by Render's persistent disk mount)
RUN mkdir -p /data

# Set environment variables
ENV NODE_ENV=production
# PORT will be set by Render, default to 3000
ENV PORT=3000
# DB_PATH will use /data for Render persistent disk
ENV DB_PATH=/data/memory.db

# Expose port 3000 (Render will map this)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD node -e "const http = require('http'); http.get('http://localhost:' + (process.env.PORT || 3000) + '/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Start the server
CMD ["npm", "start"]
