# Docker image name
IMAGE_NAME = sim-civilization-test

.PHONY: test test-build test-clean test-coverage test-watch run stop clean build dev

# Build the application
build:
	npm run build

# Run development server
dev:
	npm run dev

# Main test target - builds and runs tests
test: test-build
	docker run --rm $(IMAGE_NAME)

# Build the test Docker image
test-build:
	docker build -f Dockerfile.test -t $(IMAGE_NAME) .

# Run tests with watch mode for development
test-watch: test-build
	docker run --rm -it $(IMAGE_NAME) npm run test:watch

# Run tests with coverage report
test-coverage: test-build
	docker run --rm -v $(PWD)/coverage:/app/coverage $(IMAGE_NAME) npm run test:coverage

# Clean up test artifacts and Docker image
test-clean:
	docker rmi -f $(IMAGE_NAME)
	rm -rf coverage/
	rm -rf dist/

# Run the Jaeger stack
run: build
	@echo "\033[32mStarting services...\033[0m"
	docker-compose up -d
	@echo "\033[32mUI is available at http://localhost:8080\033[0m"

# Stop the Jaeger stack
stop:
	@echo "\033[33mStopping services...\033[0m"
	docker-compose down

# Clean up docker resources
clean: stop test-clean
	@echo "\033[33mCleaning up docker resources...\033[0m"
	docker-compose down -v --remove-orphans
	rm -rf node_modules/

# Help target
help:
	@echo "Available targets:"
	@echo "  build         - Build the application"
	@echo "  dev          - Run development server"
	@echo "  test         - Build and run tests in Docker"
	@echo "  test-build   - Build the test Docker image"
	@echo "  test-watch   - Run tests in watch mode (interactive)"
	@echo "  test-coverage - Run tests with coverage report"
	@echo "  test-clean   - Clean up test artifacts and Docker image"
	@echo "  run          - Build and run the stack"
	@echo "  stop         - Stop the stack"
	@echo "  clean        - Clean up docker resources"
	@echo "  help         - Show this help message"

# Default target
.DEFAULT_GOAL := help
