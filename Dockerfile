# Use Node.js LTS version as base image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies including React
RUN npm install

# Copy all project files
COPY . .

# Build the application
RUN npm run build

# Expose port for the web server
EXPOSE 8080

# Command to run the application
CMD ["npx", "http-server", "dist", "-p", "8080"]
