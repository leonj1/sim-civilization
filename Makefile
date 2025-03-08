# Docker image name
IMAGE_NAME = sim-civilization-test

.PHONY: test test-build test-clean test-coverage test-watch

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
	@echo "  help         - Show this help message"

# Default target
.DEFAULT_GOAL := help 