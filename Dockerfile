# Use Node.js LTS version as base image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies including opentelemetry
RUN npm install && \
    npm install --save @opentelemetry/api

# Copy all project files
COPY . .

# Expose port for the web server
EXPOSE 8080

# Command to run the application
CMD ["npx", "http-server", "-p", "8080"]
