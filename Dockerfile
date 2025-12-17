# Use Node.js 18 base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy server directory
COPY server/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy server source code
COPY server/ ./

# Copy workspace directory (needed for compilation)
COPY server/workspace ./workspace

# Expose port
EXPOSE 3001

# Start the server
CMD ["npm", "start"]
