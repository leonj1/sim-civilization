// Jest setup file

// Set up any global test configurations here
global.console = {
  ...console,
  // You can customize console behavior for tests
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Mock any browser globals that might be used in the code
global.document = {};
global.window = {};

// Add any other global setup needed for tests