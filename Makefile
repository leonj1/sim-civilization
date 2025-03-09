# Docker image name
IMAGE_NAME = sim-civilization-test

.PHONY: test test-build test-clean test-coverage test-watch run stop clean

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

# Help target
help:
	@echo "Available targets:"
	@echo "  test          - Build and run tests in Docker"
	@echo "  test-build   - Build the test Docker image"
	@echo "  test-watch   - Run tests in watch mode (interactive)"
	@echo "  test-coverage - Run tests with coverage report"
	@echo "  test-clean   - Clean up test artifacts and Docker image"
	@echo "  run          - Run the Jaeger stack"
	@echo "  stop         - Stop the Jaeger stack"
	@echo "  clean        - Clean up docker resources"
	@echo "  help         - Show this help message"

# Default target
.DEFAULT_GOAL := help

# Run the Jaeger stack
run:
	@echo "\033[32mStarting Jaeger services...\033[0m"
	docker-compose up -d
	@echo "\033[32mJaeger UI is available at http://localhost:$${JAEGER_UI_PORT:-16686}\033[0m"

# Stop the Jaeger stack
stop:
	@echo "\033[33mStopping Jaeger services...\033[0m"
	docker-compose down

# Clean up docker resources
clean: stop
	@echo "\033[33mCleaning up docker resources...\033[0m"
	docker-compose down -v --remove-orphans 