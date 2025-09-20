const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const User = require('../models/users');
const Sweet = require('../models/sweets');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Test database setup
beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
});

afterAll(async () => {
  await User.deleteMany({ email: /test.*@example\.com/ });
  await Sweet.deleteMany({ name: /test.*sweet/i });
  await mongoose.connection.close();
});

describe('Authentication Middleware', () => {
  let adminToken, userToken, adminId, userId;

  beforeAll(async () => {
    // Create admin user
    const admin = new User({
      username: 'adminmiddleware',
      email: 'adminmiddleware@example.com',
      password: await bcrypt.hash('Admin1234', 10),
      role: 'admin'
    });
    await admin.save();
    adminId = admin._id;
    adminToken = jwt.sign(
      { userId: admin._id.toString(), role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Create regular user
    const user = new User({
      username: 'usermiddleware',
      email: 'usermiddleware@example.com',
      password: await bcrypt.hash('User1234', 10),
      role: 'user'
    });
    await user.save();
    userId = user._id;
    userToken = jwt.sign(
      { userId: user._id.toString(), role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await User.deleteMany({ email: /middleware@example\.com/ });
  });

  describe('Auth Middleware', () => {
    it('should allow access with valid admin token', async () => {
      const testSweet = global.testUtils.generateTestSweet();
      
      const res = await request(app)
        .post('/api/sweets/createSweet')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testSweet);
      
      expect(res.statusCode).toBe(201);
    });

    it('should allow access with valid user token for non-admin routes', async () => {
      const res = await request(app)
        .get('/api/sweets/getSweets');
      
      expect(res.statusCode).toBe(200);
    });

    it('should reject access without token', async () => {
      const testSweet = global.testUtils.generateTestSweet();
      
      const res = await request(app)
        .post('/api/sweets/createSweet')
        .send(testSweet);
      
      expect(res.statusCode).toBe(401);
    });

    it('should reject access with invalid token', async () => {
      const testSweet = global.testUtils.generateTestSweet();
      
      const res = await request(app)
        .post('/api/sweets/createSweet')
        .set('Authorization', 'Bearer invalid-token')
        .send(testSweet);
      
      expect(res.statusCode).toBe(401);
    });

    it('should reject access with malformed token', async () => {
      const testSweet = global.testUtils.generateTestSweet();
      
      const res = await request(app)
        .post('/api/sweets/createSweet')
        .set('Authorization', 'InvalidFormat')
        .send(testSweet);
      
      expect(res.statusCode).toBe(401);
    });

    it('should reject access with expired token', async () => {
      const expiredToken = jwt.sign(
        { userId: adminId.toString(), role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' } // Expired token
      );
      
      const testSweet = global.testUtils.generateTestSweet();
      
      const res = await request(app)
        .post('/api/sweets/createSweet')
        .set('Authorization', `Bearer ${expiredToken}`)
        .send(testSweet);
      
      expect(res.statusCode).toBe(401);
    });

    it('should reject access with token for non-existent user', async () => {
      const nonExistentUserId = '507f1f77bcf86cd799439011';
      const tokenForNonExistentUser = jwt.sign(
        { userId: nonExistentUserId, role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      const testSweet = global.testUtils.generateTestSweet();
      
      const res = await request(app)
        .post('/api/sweets/createSweet')
        .set('Authorization', `Bearer ${tokenForNonExistentUser}`)
        .send(testSweet);
      
      expect(res.statusCode).toBe(401);
    });
  });

  describe('Admin Authorization Middleware', () => {
    it('should allow admin access to admin-only routes', async () => {
      const testSweet = global.testUtils.generateTestSweet();
      
      const res = await request(app)
        .post('/api/sweets/createSweet')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testSweet);
      
      expect(res.statusCode).toBe(201);
    });

    it('should reject user access to admin-only routes', async () => {
      const testSweet = global.testUtils.generateTestSweet();
      
      const res = await request(app)
        .post('/api/sweets/createSweet')
        .set('Authorization', `Bearer ${userToken}`)
        .send(testSweet);
      
      expect(res.statusCode).toBe(403);
    });

    it('should reject access to admin routes without token', async () => {
      const testSweet = global.testUtils.generateTestSweet();
      
      const res = await request(app)
        .post('/api/sweets/createSweet')
        .send(testSweet);
      
      expect(res.statusCode).toBe(401);
    });

    it('should reject access to admin routes with invalid token', async () => {
      const testSweet = global.testUtils.generateTestSweet();
      
      const res = await request(app)
        .post('/api/sweets/createSweet')
        .set('Authorization', 'Bearer invalid-token')
        .send(testSweet);
      
      expect(res.statusCode).toBe(401);
    });
  });
});

describe('Middleware Error Handling', () => {
  it('should handle missing Authorization header gracefully', async () => {
    const testSweet = global.testUtils.generateTestSweet();
    
    const res = await request(app)
      .post('/api/sweets/createSweet')
      .send(testSweet);
    
    expect(res.statusCode).toBe(401);
  });

  it('should handle empty Authorization header gracefully', async () => {
    const testSweet = global.testUtils.generateTestSweet();
    
    const res = await request(app)
      .post('/api/sweets/createSweet')
      .set('Authorization', '')
      .send(testSweet);
    
    expect(res.statusCode).toBe(401);
  });

  it('should handle Authorization header without Bearer prefix', async () => {
    const testSweet = global.testUtils.generateTestSweet();
    
    const res = await request(app)
      .post('/api/sweets/createSweet')
      .set('Authorization', 'some-token')
      .send(testSweet);
    
    expect(res.statusCode).toBe(401);
  });
});
