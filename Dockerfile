# Use Node.js 18 base image
FROM node:18-alpine

# Install bash for compactc script
RUN apk add --no-cache bash

# Set working directory to server
WORKDIR /app

# Copy package files from server directory
COPY server/package*.json ./

# Install dependencies (including devDependencies for TypeScript)
RUN npm ci

# Copy all server files including workspace with compcomp binaries
COPY server/ ./

# Make compactc and all binaries executable
RUN chmod +x ./workspace/contract/compcomp/* || true

# Expose port
EXPOSE 3001

# Set environment variable for port
ENV PORT=3001

# Start the server
CMD ["node", "index.js"]
