# Use Node.js 18 base image
FROM node:18-alpine

# Set working directory to server
WORKDIR /app

# Copy package files from server directory
COPY server/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy all server files
COPY server/ ./

# Expose port
EXPOSE 3001

# Set environment variable for port
ENV PORT=3001

# Start the server
CMD ["node", "index.js"]
