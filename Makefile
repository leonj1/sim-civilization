# Docker image names
IMAGE_NAME_TEST = sim-civilization-test
IMAGE_NAME_APP = sim-civilization-app

.PHONY: test test-build test-clean test-coverage test-watch build run stop clean

# Main test target - builds and runs tests
test: test-build
	docker run --rm $(IMAGE_NAME_TEST)

# Build the test Docker image
test-build:
	docker build -f Dockerfile.test -t $(IMAGE_NAME_TEST) .

# Run tests with watch mode for development
test-watch: test-build
	docker run --rm -it $(IMAGE_NAME_TEST) npm run test:watch

# Run tests with coverage report
test-coverage: test-build
	docker run --rm -v $(PWD)/coverage:/app/coverage $(IMAGE_NAME_TEST) npm run test:coverage

# Clean up test artifacts and Docker image
test-clean:
	docker rmi -f $(IMAGE_NAME_TEST)
	rm -rf coverage/

# Help target
help:
	@echo "Available targets:"
	@echo "  test          - Build and run tests in Docker"
	@echo "  test-build    - Build the test Docker image"
	@echo "  test-watch    - Run tests in watch mode (interactive)"
	@echo "  test-coverage - Run tests with coverage report"
	@echo "  test-clean    - Clean up test artifacts and Docker image"
	@echo "  build         - Build the application Docker image"
	@echo "  run           - Run the application in Docker (builds first if needed)"
	@echo "  stop          - Stop the running application container"
	@echo "  clean         - Clean up Docker resources"
	@echo "  help          - Show this help message"

# Default target
.DEFAULT_GOAL := help

# Build the application Docker image
build:
	@echo "\033[32mBuilding the application Docker image...\033[0m"
	docker build -t $(IMAGE_NAME_APP) .

# Run the application (builds first if needed)
run: build
	@echo "\033[32mStarting the application...\033[0m"
	docker run -d --name sim-civilization \
		-p 8080:8080 \
		-e NODE_ENV=development \
		$(IMAGE_NAME_APP)
	@echo "\033[32mApplication is running at http://localhost:8080\033[0m"

# Stop the application
stop:
	@echo "\033[33mStopping the application...\033[0m"
	docker stop -t 0 sim-civilization || true
	docker rm -f sim-civilization || true

# Clean up docker resources
clean: stop
	@echo "\033[33mCleaning up docker resources...\033[0m"
	docker rmi -f $(IMAGE_NAME_APP) || true
	docker rmi -f $(IMAGE_NAME_TEST) || true