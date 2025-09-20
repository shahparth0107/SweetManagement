const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const User = require('../models/users');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Test database setup
beforeAll(async () => {
  // Connect to test database
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
  // Wait for app to be ready
  await new Promise(resolve => setTimeout(resolve, 100));
});

afterAll(async () => {
  // Clean up test data
  await User.deleteMany({ email: /test.*@example\.com/ });
  await mongoose.connection.close();
});

describe('Auth API - Registration', () => {
  const testUser = global.testUtils.generateTestUser();

  afterEach(async () => {
    // Clean up after each test
    await User.deleteMany({ email: testUser.email });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);
      
      expect(res.statusCode).toBe(201);
      expect(res.body.message).toMatch(/registered successfully/i);
      expect(res.body).not.toHaveProperty('user');
    });

    it('should prevent duplicate email registration', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(testUser);
      
      // Attempt duplicate registration
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);
      
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it('should prevent duplicate username registration', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(testUser);
      
      // Attempt duplicate username with different email
      const duplicateUser = {
        ...testUser,
        email: 'different@example.com'
      };
      
      const res = await request(app)
        .post('/api/auth/register')
        .send(duplicateUser);
      
      expect(res.statusCode).toBe(400);
    });

    it('should reject registration with missing fields', async () => {
      const invalidUser = { username: 'test' };
      
      const res = await request(app)
        .post('/api/auth/register')
        .send(invalidUser);
      
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/required/i);
    });

    it('should reject registration with invalid email format', async () => {
      const invalidUser = {
        ...testUser,
        email: 'invalid-email'
      };
      
      const res = await request(app)
        .post('/api/auth/register')
        .send(invalidUser);
      
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/invalid email/i);
    });

    it('should reject registration with weak password', async () => {
      const invalidUser = {
        ...testUser,
        password: '123'
      };
      
      const res = await request(app)
        .post('/api/auth/register')
        .send(invalidUser);
      
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/password must be at least 8 characters/i);
    });

    it('should reject registration with password without numbers', async () => {
      const invalidUser = {
        ...testUser,
        password: 'passwordonly'
      };
      
      const res = await request(app)
        .post('/api/auth/register')
        .send(invalidUser);
      
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/password must be at least 8 characters/i);
    });

    it('should reject registration with empty strings', async () => {
      const invalidUser = {
        username: '',
        email: '',
        password: ''
      };
      
      const res = await request(app)
        .post('/api/auth/register')
        .send(invalidUser);
      
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/required/i);
    });

    it('should trim whitespace from input fields', async () => {
      const uniqueEmail = `test_${Date.now()}@example.com`;
      const userWithWhitespace = {
        username: '  testuser  ',
        email: `  ${uniqueEmail}  `,
        password: 'Test1234'
      };
      
      const res = await request(app)
        .post('/api/auth/register')
        .send(userWithWhitespace);
      
      expect(res.statusCode).toBe(201);
      
      // Verify user was saved with trimmed values
      const savedUser = await User.findOne({ email: uniqueEmail });
      expect(savedUser.username).toBe('testuser');
      expect(savedUser.email).toBe(uniqueEmail);
      
      // Clean up
      await User.findByIdAndDelete(savedUser._id);
    });

    it('should set default role as user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);
      
      expect(res.statusCode).toBe(201);
      
      const savedUser = await User.findOne({ email: testUser.email });
      expect(savedUser.role).toBe('user');
    });
  });
});

describe('Auth API - Login', () => {
  const testUser = global.testUtils.generateTestUser();
  let hashedPassword;

  beforeAll(async () => {
    // Create a user for login tests
    hashedPassword = await bcrypt.hash(testUser.password, 10);
    await User.create({
      ...testUser,
      password: hashedPassword
    });
  });

  afterAll(async () => {
    await User.deleteMany({ email: testUser.email });
  });

  describe('POST /api/auth/login', () => {
    it('should login with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toMatch(/login successful/i);
      expect(res.body.user).toHaveProperty('_id');
      expect(res.body.user).toHaveProperty('email', testUser.email);
      expect(res.body.user).toHaveProperty('username', testUser.username);
      expect(res.body.user).toHaveProperty('role', 'user');
      expect(res.body.user).toHaveProperty('token');
      expect(typeof res.body.user.token).toBe('string');
    });

    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        });
      
      expect(res.statusCode).toBe(401);
      expect(res.body.error).toMatch(/invalid password/i);
    });

    it('should reject login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password
        });
      
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toMatch(/user not found/i);
    });

    it('should reject login with missing email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          password: testUser.password
        });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/email and password are required/i);
    });

    it('should reject login with missing password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email
        });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/email and password are required/i);
    });

    it('should reject login with empty credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});
      
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/email and password are required/i);
    });

    it('should handle case-insensitive email login', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email.toUpperCase(),
          password: testUser.password
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.user.email).toBe(testUser.email);
    });

    it('should generate valid JWT token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });
      
      expect(res.statusCode).toBe(200);
      
      const token = res.body.user.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      expect(decoded).toHaveProperty('userId');
      expect(decoded).toHaveProperty('role', 'user');
      expect(decoded).toHaveProperty('exp');
    });

    it('should handle server errors gracefully', async () => {
      // Mock User.findOne to throw an error
      const originalFindOne = User.findOne;
      User.findOne = jest.fn().mockRejectedValue(new Error('Database error'));
      
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });
      
      expect(res.statusCode).toBe(500);
      expect(res.body.error).toMatch(/internal server error/i);
      
      // Restore original method
      User.findOne = originalFindOne;
    });
  });
});