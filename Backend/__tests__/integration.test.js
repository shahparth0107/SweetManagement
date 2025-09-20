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

describe('Complete User Workflow Integration Tests', () => {
  let userToken, adminToken, userId, adminId;

  beforeAll(async () => {
    // Create admin user
    const admin = new User({
      username: 'adminintegration',
      email: 'adminintegration@example.com',
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
  });

  afterAll(async () => {
    await User.deleteMany({ email: /integration@example\.com/ });
    await Sweet.deleteMany({ name: /integration.*sweet/i });
  });

  describe('User Registration and Login Flow', () => {
    it('should complete full user registration and login workflow', async () => {
      // Step 1: Register a new user
      const userData = {
        username: `integrationuser_${Date.now()}`,
        email: `integrationuser_${Date.now()}@example.com`,
        password: 'Test1234'
      };

      const registerRes = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(registerRes.statusCode).toBe(201);
      expect(registerRes.body.message).toMatch(/registered successfully/i);

      // Step 2: Login with the registered user
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        });

      expect(loginRes.statusCode).toBe(200);
      expect(loginRes.body.user).toHaveProperty('token');
      expect(loginRes.body.user.email).toBe(userData.email);
      expect(loginRes.body.user.role).toBe('user');

      userToken = loginRes.body.user.token;
      userId = loginRes.body.user._id;
    });

    it('should handle user trying to access admin routes', async () => {
      const testSweet = global.testUtils.generateTestSweet();

      const res = await request(app)
        .post('/api/sweets/createSweet')
        .set('Authorization', `Bearer ${userToken}`)
        .send(testSweet);

      expect(res.statusCode).toBe(403);
    });
  });

  describe('Admin Sweet Management Workflow', () => {
    let sweetId;

    it('should complete full admin sweet management workflow', async () => {
      // Step 1: Admin creates a sweet
      const sweetData = {
        name: 'Integration Test Sweet',
        description: 'A sweet for integration testing',
        price: 15.99,
        category: 'Integration Test',
        imageUrl: 'https://example.com/integration-sweet.jpg',
        quantity: 50
      };

      const createRes = await request(app)
        .post('/api/sweets/createSweet')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(sweetData);

      expect(createRes.statusCode).toBe(201);
      expect(createRes.body.sweet).toHaveProperty('_id');
      sweetId = createRes.body.sweet._id;

      // Step 2: Admin updates the sweet
      const updateData = {
        name: 'Updated Integration Test Sweet',
        description: 'Updated description',
        price: 19.99,
        category: 'Updated Integration Test',
        imageUrl: 'https://example.com/updated-integration-sweet.jpg',
        quantity: 75
      };

      const updateRes = await request(app)
        .put(`/api/sweets/updateSweet/${sweetId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(updateRes.statusCode).toBe(200);
      expect(updateRes.body.sweet.name).toBe(updateData.name);
      expect(updateRes.body.sweet.price).toBe(updateData.price);

      // Step 3: Admin restocks the sweet
      const restockRes = await request(app)
        .post(`/api/sweets/${sweetId}/restock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ quantity: 25 });

      expect(restockRes.statusCode).toBe(200);
      expect(restockRes.body.sweet.quantity).toBe(100); // 75 + 25

      // Step 4: User purchases the sweet
      const purchaseRes = await request(app)
        .post(`/api/sweets/${sweetId}/purchase`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 10 });

      expect(purchaseRes.statusCode).toBe(200);
      expect(purchaseRes.body.sweet.quantity).toBe(90); // 100 - 10

      // Step 5: Admin deletes the sweet
      const deleteRes = await request(app)
        .delete(`/api/sweets/deleteSweet/${sweetId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(deleteRes.statusCode).toBe(200);

      // Verify sweet is deleted
      const deletedSweet = await Sweet.findById(sweetId);
      expect(deletedSweet).toBeNull();
    });
  });

  describe('Search and Browse Workflow', () => {
    beforeEach(async () => {
      // Create test sweets for search
      const testSweets = [
        {
          name: 'Chocolate Integration Sweet',
          description: 'Delicious chocolate for integration testing',
          price: 8.99,
          category: 'Chocolate',
          imageUrl: 'https://example.com/chocolate-integration.jpg',
          quantity: 100
        },
        {
          name: 'Vanilla Integration Cake',
          description: 'Sweet vanilla cake for integration testing',
          price: 25.99,
          category: 'Cake',
          imageUrl: 'https://example.com/cake-integration.jpg',
          quantity: 30
        },
        {
          name: 'Strawberry Integration Candy',
          description: 'Fruity strawberry candy for integration testing',
          price: 3.99,
          category: 'Candy',
          imageUrl: 'https://example.com/candy-integration.jpg',
          quantity: 200
        }
      ];

      for (const sweet of testSweets) {
        const sweetDoc = new Sweet(sweet);
        await sweetDoc.save();
      }
    });

    afterEach(async () => {
      await Sweet.deleteMany({ name: /integration.*sweet/i });
    });

    it('should complete full search and browse workflow', async () => {
      // Step 1: Browse all sweets
      const browseRes = await request(app)
        .get('/api/sweets/getSweets');

      expect(browseRes.statusCode).toBe(200);
      expect(Array.isArray(browseRes.body.sweets)).toBe(true);
      expect(browseRes.body.sweets.length).toBeGreaterThanOrEqual(3);

      // Step 2: Search by keyword
      const keywordSearchRes = await request(app)
        .get('/api/sweets/searchSweet?q=chocolate');

      expect(keywordSearchRes.statusCode).toBe(200);
      expect(keywordSearchRes.body.sweets.length).toBeGreaterThan(0);
      expect(keywordSearchRes.body.sweets[0].name).toMatch(/chocolate/i);

      // Step 3: Search by category
      const categorySearchRes = await request(app)
        .get('/api/sweets/searchSweet?category=cake');

      expect(categorySearchRes.statusCode).toBe(200);
      expect(categorySearchRes.body.sweets.length).toBeGreaterThan(0);
      expect(categorySearchRes.body.sweets[0].category).toMatch(/cake/i);

      // Step 4: Search by price range
      const priceSearchRes = await request(app)
        .get('/api/sweets/searchSweet?minprice=5&maxprice=15');

      expect(priceSearchRes.statusCode).toBe(200);
      expect(priceSearchRes.body.sweets.length).toBeGreaterThan(0);
      expect(priceSearchRes.body.sweets[0].price).toBeGreaterThanOrEqual(5);
      expect(priceSearchRes.body.sweets[0].price).toBeLessThanOrEqual(15);

      // Step 5: Search with multiple filters
      const multiFilterRes = await request(app)
        .get('/api/sweets/searchSweet?q=integration&category=candy&instock=true');

      expect(multiFilterRes.statusCode).toBe(200);
      expect(multiFilterRes.body.sweets.length).toBeGreaterThan(0);
      expect(multiFilterRes.body.sweets[0].name).toMatch(/integration/i);
      expect(multiFilterRes.body.sweets[0].category).toMatch(/candy/i);
      expect(multiFilterRes.body.sweets[0].quantity).toBeGreaterThan(0);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle concurrent user registrations gracefully', async () => {
      const timestamp = Date.now();
      const userData1 = {
        username: `concurrentuser1_${timestamp}`,
        email: `concurrentuser1_${timestamp}@example.com`,
        password: 'Test1234'
      };

      const userData2 = {
        username: `concurrentuser2_${timestamp + 1}`,
        email: `concurrentuser2_${timestamp + 1}@example.com`,
        password: 'Test1234'
      };

      // Attempt concurrent registrations
      const [res1, res2] = await Promise.all([
        request(app).post('/api/auth/register').send(userData1),
        request(app).post('/api/auth/register').send(userData2)
      ]);

      expect(res1.statusCode).toBe(201);
      expect(res2.statusCode).toBe(201);
    });

    it('should handle invalid sweet operations gracefully', async () => {
      const invalidSweetId = '507f1f77bcf86cd799439011';

      // Attempt to update non-existent sweet
      const updateRes = await request(app)
        .put(`/api/sweets/updateSweet/${invalidSweetId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Sweet',
          description: 'Updated description',
          price: 10.99,
          category: 'Test',
          imageUrl: 'https://example.com/test.jpg',
          quantity: 50
        });

      expect(updateRes.statusCode).toBe(404);

      // Attempt to delete non-existent sweet
      const deleteRes = await request(app)
        .delete(`/api/sweets/deleteSweet/${invalidSweetId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(deleteRes.statusCode).toBe(404);

      // Attempt to purchase non-existent sweet
      const purchaseRes = await request(app)
        .post(`/api/sweets/purchaseSweet/${invalidSweetId}`)
        .send({ quantity: 5 });

      expect(purchaseRes.statusCode).toBe(400);
    });

    it('should handle malformed requests gracefully', async () => {
      // Malformed JSON
      const malformedRes = await request(app)
        .post('/api/auth/register')
        .set('Content-Type', 'application/json')
        .send('{"username": "test", "email": "test@example.com", "password": "Test1234"');

      expect(malformedRes.statusCode).toBe(400);

      // Missing required fields
      const missingFieldsRes = await request(app)
        .post('/api/sweets/createSweet')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test Sweet' });

      expect(missingFieldsRes.statusCode).toBe(400);
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle multiple simultaneous requests', async () => {
      const requests = [];
      
      // Create multiple simultaneous requests
      for (let i = 0; i < 10; i++) {
        requests.push(
          request(app)
            .get('/api/sweets/getSweets')
        );
      }

      const responses = await Promise.all(requests);
      
      // All requests should succeed
      responses.forEach(res => {
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.sweets)).toBe(true);
      });
    });

    it('should handle rapid sweet creation and deletion', async () => {
      const sweetIds = [];

      // Create multiple sweets rapidly
      for (let i = 0; i < 5; i++) {
        const sweetData = {
          name: `Rapid Test Sweet ${i}`,
          description: `Rapid test sweet ${i}`,
          price: 10 + i,
          category: 'Rapid Test',
          imageUrl: `https://example.com/rapid-${i}.jpg`,
          quantity: 50
        };

        const createRes = await request(app)
          .post('/api/sweets/createSweet')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(sweetData);

        expect(createRes.statusCode).toBe(201);
        sweetIds.push(createRes.body.sweet._id);
      }

      // Delete all created sweets
      for (const sweetId of sweetIds) {
        const deleteRes = await request(app)
          .delete(`/api/sweets/deleteSweet/${sweetId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(deleteRes.statusCode).toBe(200);
      }
    });
  });
});
