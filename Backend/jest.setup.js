// Jest setup file for backend tests
require('dotenv').config();

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sweet-shop-test';

// Increase timeout for database operations
jest.setTimeout(10000);

// Global test utilities
global.testUtils = {
  generateTestUser: () => ({
    username: `testuser${Date.now()}`,
    email: `test${Date.now()}@example.com`,
    password: 'Test1234'
  }),
  
  generateTestSweet: () => ({
    name: `Test Sweet ${Date.now()}`,
    description: 'A test sweet for testing purposes',
    price: 10.99,
    category: 'Test Category',
    imageUrl: 'https://example.com/test-image.jpg',
    quantity: 100
  })
};
