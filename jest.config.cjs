module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  moduleFileExtensions: ['js', 'json'],
  testMatch: ['**/__tests__/**/*.test.js'],
  moduleNameMapper: {
    // Add any module name mappings here if needed
  },
  setupFilesAfterEnv: ['./jest.setup.js'],
  collectCoverageFrom: [
    'js/modules/**/*.js',
    '!js/modules/__mocks__/**',
    '!js/modules/__tests__/**'
  ],
  coverageDirectory: './coverage',
  verbose: true
};