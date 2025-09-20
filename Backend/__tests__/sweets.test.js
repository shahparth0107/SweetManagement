const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const Sweet = require('../models/sweets');
const User = require('../models/users');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

let adminToken, userToken, sweetId, adminId, userId;

// Test database setup
beforeAll(async () => {
  // Connect to test database
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
  // Wait for app to be ready
  await new Promise(resolve => setTimeout(resolve, 100));

  // Create admin user
  const admin = new User({
    username: 'adminjest',
    email: 'adminjest@example.com',
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
    username: 'userjest',
    email: 'userjest@example.com',
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
  // Clean up test data
  await Sweet.deleteMany({ name: /test.*sweet/i });
  await User.deleteMany({ email: /jest@example\.com/ });
  await mongoose.connection.close();
});

describe('Sweets API - CRUD Operations', () => {
  describe('POST /api/sweets/createSweet', () => {
    it('should create a sweet with valid data (admin only)', async () => {
      const testSweet = global.testUtils.generateTestSweet();
      
      const res = await request(app)
        .post('/api/sweets/createSweet')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testSweet);
      
      expect(res.statusCode).toBe(201);
      expect(res.body.message).toMatch(/created successfully/i);
      expect(res.body.sweet).toHaveProperty('_id');
      expect(res.body.sweet.name).toBe(testSweet.name);
      expect(res.body.sweet.price).toBe(testSweet.price);
      expect(res.body.sweet.quantity).toBe(testSweet.quantity);
      
      sweetId = res.body.sweet._id;
    });

    it('should reject sweet creation without admin token', async () => {
      const testSweet = global.testUtils.generateTestSweet();
      
      const res = await request(app)
        .post('/api/sweets/createSweet')
        .send(testSweet);
      
      expect(res.statusCode).toBe(401);
    });

    it('should reject sweet creation with user token', async () => {
      const testSweet = global.testUtils.generateTestSweet();
      
      const res = await request(app)
        .post('/api/sweets/createSweet')
        .set('Authorization', `Bearer ${userToken}`)
        .send(testSweet);
      
      expect(res.statusCode).toBe(403);
    });

    it('should reject sweet creation with missing fields', async () => {
      const incompleteSweet = {
        name: 'Test Sweet',
        price: 10
        // Missing required fields
      };
      
      const res = await request(app)
        .post('/api/sweets/createSweet')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(incompleteSweet);
      
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/required/i);
    });

    it('should reject sweet creation with negative price', async () => {
      const invalidSweet = {
        ...global.testUtils.generateTestSweet(),
        price: -10
      };
      
      const res = await request(app)
        .post('/api/sweets/createSweet')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidSweet);
      
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/required/i);
    });

    it('should reject sweet creation with negative quantity', async () => {
      const invalidSweet = {
        ...global.testUtils.generateTestSweet(),
        quantity: -5
      };
      
      const res = await request(app)
        .post('/api/sweets/createSweet')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidSweet);
      
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/required/i);
    });

    it('should reject duplicate sweet creation (same name and category)', async () => {
      const testSweet = global.testUtils.generateTestSweet();
      
      // Create first sweet
      await request(app)
        .post('/api/sweets/createSweet')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testSweet);
      
      // Attempt to create duplicate
      const res = await request(app)
        .post('/api/sweets/createSweet')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testSweet);
      
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it('should allow sweet creation with same name but different category', async () => {
      const testSweet = global.testUtils.generateTestSweet();
      const duplicateNameSweet = {
        ...testSweet,
        category: 'Different Category'
      };
      
      const res = await request(app)
        .post('/api/sweets/createSweet')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(duplicateNameSweet);
      
      expect(res.statusCode).toBe(201);
    });

    it('should handle server errors gracefully', async () => {
      // Mock Sweet constructor to throw an error
      const originalSweet = Sweet;
      const mockSweet = jest.fn().mockImplementation(() => {
        throw new Error('Database error');
      });
      
      // Replace Sweet constructor temporarily
      jest.doMock('../models/sweets', () => ({
        __esModule: true,
        default: mockSweet
      }));
      
      const testSweet = global.testUtils.generateTestSweet();
      
      const res = await request(app)
        .post('/api/sweets/createSweet')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testSweet);
      
      expect(res.statusCode).toBe(500);
      expect(res.body.message).toMatch(/server error/i);
      
      // Restore original constructor
      jest.dontMock('../models/sweets');
    });
  });

  describe('GET /api/sweets/getSweets', () => {
    it('should get all sweets without authentication', async () => {
      const res = await request(app)
        .get('/api/sweets/getSweets');
      
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.sweets)).toBe(true);
      expect(res.body.sweets.length).toBeGreaterThan(0);
    });

    it('should return empty array when no sweets exist', async () => {
      // Clear all sweets
      await Sweet.deleteMany({});
      
      const res = await request(app)
        .get('/api/sweets/getSweets');
      
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.sweets)).toBe(true);
      expect(res.body.sweets.length).toBe(0);
    });

    it('should handle server errors gracefully', async () => {
      // Mock Sweet.find to throw an error
      const originalFind = Sweet.find;
      Sweet.find = jest.fn().mockRejectedValue(new Error('Database error'));
      
      const res = await request(app)
        .get('/api/sweets/getSweets');
      
      expect(res.statusCode).toBe(500);
      expect(res.body.message).toMatch(/server error/i);
      
      // Restore original method
      Sweet.find = originalFind;
    });
  });

  describe('PUT /api/sweets/updateSweet/:id', () => {
    beforeEach(async () => {
      // Create a sweet for update tests
      const testSweet = global.testUtils.generateTestSweet();
      const sweet = new Sweet(testSweet);
      await sweet.save();
      sweetId = sweet._id;
    });

    afterEach(async () => {
      // Clean up after each test
      await Sweet.findByIdAndDelete(sweetId);
    });

    it('should update a sweet with valid data (admin only)', async () => {
      const updateData = {
        name: 'Updated Test Sweet',
        description: 'Updated description',
        price: 15.99,
        category: 'Updated Category',
        imageUrl: 'https://example.com/updated-image.jpg',
        quantity: 50
      };
      
      const res = await request(app)
        .put(`/api/sweets/updateSweet/${sweetId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toMatch(/updated successfully/i);
      expect(res.body.sweet.name).toBe(updateData.name);
      expect(res.body.sweet.price).toBe(updateData.price);
      expect(res.body.sweet.quantity).toBe(updateData.quantity);
    });

    it('should reject update without admin token', async () => {
      const updateData = {
        name: 'Updated Test Sweet',
        description: 'Updated description',
        price: 15.99,
        category: 'Updated Category',
        imageUrl: 'https://example.com/updated-image.jpg',
        quantity: 50
      };
      
      const res = await request(app)
        .put(`/api/sweets/updateSweet/${sweetId}`)
        .send(updateData);
      
      expect(res.statusCode).toBe(401);
    });

    it('should reject update with user token', async () => {
      const updateData = {
        name: 'Updated Test Sweet',
        description: 'Updated description',
        price: 15.99,
        category: 'Updated Category',
        imageUrl: 'https://example.com/updated-image.jpg',
        quantity: 50
      };
      
      const res = await request(app)
        .put(`/api/sweets/updateSweet/${sweetId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData);
      
      expect(res.statusCode).toBe(403);
    });

    it('should reject update with invalid sweet ID', async () => {
      const invalidId = '507f1f77bcf86cd799439011';
      const updateData = {
        name: 'Updated Test Sweet',
        description: 'Updated description',
        price: 15.99,
        category: 'Updated Category',
        imageUrl: 'https://example.com/updated-image.jpg',
        quantity: 50
      };
      
      const res = await request(app)
        .put(`/api/sweets/updateSweet/${invalidId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);
      
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toMatch(/not found/i);
    });

    it('should reject update with missing fields', async () => {
      const incompleteData = {
        name: 'Updated Test Sweet'
        // Missing required fields
      };
      
      const res = await request(app)
        .put(`/api/sweets/updateSweet/${sweetId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(incompleteData);
      
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/required/i);
    });

    it('should reject update with negative price', async () => {
      const invalidData = {
        name: 'Updated Test Sweet',
        description: 'Updated description',
        price: -10,
        category: 'Updated Category',
        imageUrl: 'https://example.com/updated-image.jpg',
        quantity: 50
      };
      
      const res = await request(app)
        .put(`/api/sweets/updateSweet/${sweetId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);
      
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/required/i);
    });
  });

  describe('DELETE /api/sweets/deleteSweet/:id', () => {
    beforeEach(async () => {
      // Create a sweet for delete tests
      const testSweet = global.testUtils.generateTestSweet();
      const sweet = new Sweet(testSweet);
      await sweet.save();
      sweetId = sweet._id;
    });

    it('should delete a sweet (admin only)', async () => {
      const res = await request(app)
        .delete(`/api/sweets/deleteSweet/${sweetId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toMatch(/deleted successfully/i);
      
      // Verify sweet is deleted
      const deletedSweet = await Sweet.findById(sweetId);
      expect(deletedSweet).toBeNull();
    });

    it('should reject delete without admin token', async () => {
      const res = await request(app)
        .delete(`/api/sweets/deleteSweet/${sweetId}`);
      
      expect(res.statusCode).toBe(401);
    });

    it('should reject delete with user token', async () => {
      const res = await request(app)
        .delete(`/api/sweets/deleteSweet/${sweetId}`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.statusCode).toBe(403);
    });

    it('should reject delete with invalid sweet ID', async () => {
      const invalidId = '507f1f77bcf86cd799439011';
      
      const res = await request(app)
        .delete(`/api/sweets/deleteSweet/${invalidId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toMatch(/not found/i);
    });
  });
});

describe('Sweets API - Search and Filter', () => {
  beforeEach(async () => {
    // Create test sweets for search
    const testSweets = [
      {
        name: 'Chocolate Bar',
        description: 'Delicious chocolate bar',
        price: 5.99,
        category: 'Chocolate',
        imageUrl: 'https://example.com/chocolate.jpg',
        quantity: 100
      },
      {
        name: 'Vanilla Cake',
        description: 'Sweet vanilla cake',
        price: 15.99,
        category: 'Cake',
        imageUrl: 'https://example.com/cake.jpg',
        quantity: 50
      },
      {
        name: 'Strawberry Candy',
        description: 'Fruity strawberry candy',
        price: 2.99,
        category: 'Candy',
        imageUrl: 'https://example.com/candy.jpg',
        quantity: 200
      }
    ];

    for (const sweet of testSweets) {
      const sweetDoc = new Sweet(sweet);
      await sweetDoc.save();
    }
  });

  afterEach(async () => {
    // Clean up test sweets
    await Sweet.deleteMany({ name: /Chocolate Bar|Vanilla Cake|Strawberry Candy/ });
  });

  describe('GET /api/sweets/searchSweet', () => {
    it('should search sweets by keyword', async () => {
      const res = await request(app)
        .get('/api/sweets/searchSweet?q=chocolate');
      
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.sweets)).toBe(true);
      expect(res.body.sweets.length).toBeGreaterThan(0);
      expect(res.body.sweets[0].name).toMatch(/chocolate/i);
    });

    it('should search sweets by category', async () => {
      const res = await request(app)
        .get('/api/sweets/searchSweet?category=cake');
      
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.sweets)).toBe(true);
      expect(res.body.sweets.length).toBeGreaterThan(0);
      expect(res.body.sweets[0].category).toMatch(/cake/i);
    });

    it('should search sweets by price range', async () => {
      const res = await request(app)
        .get('/api/sweets/searchSweet?minprice=10&maxprice=20');
      
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.sweets)).toBe(true);
      expect(res.body.sweets.length).toBeGreaterThan(0);
      expect(res.body.sweets[0].price).toBeGreaterThanOrEqual(10);
      expect(res.body.sweets[0].price).toBeLessThanOrEqual(20);
    });

    it('should search sweets with multiple keywords', async () => {
      const res = await request(app)
        .get('/api/sweets/searchSweet?q=strawberry,candy');
      
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.sweets)).toBe(true);
      expect(res.body.sweets.length).toBeGreaterThan(0);
    });

    it('should search sweets with instock filter', async () => {
      const res = await request(app)
        .get('/api/sweets/searchSweet?instock=true');
      
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.sweets)).toBe(true);
      expect(res.body.sweets.length).toBeGreaterThan(0);
      expect(res.body.sweets[0].quantity).toBeGreaterThan(0);
    });

    it('should reject search without any parameters', async () => {
      const res = await request(app)
        .get('/api/sweets/searchSweet');
      
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/provide at least one/i);
    });

    it('should reject search with invalid price range', async () => {
      const res = await request(app)
        .get('/api/sweets/searchSweet?minprice=20&maxprice=10');
      
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/minprice cannot be greater than maxprice/i);
    });

    it('should reject search with invalid price values', async () => {
      const res = await request(app)
        .get('/api/sweets/searchSweet?minprice=invalid');
      
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/minprice must be a number/i);
    });
  });
});

describe('Sweets API - Purchase and Restock', () => {
  let testSweetId;

  beforeEach(async () => {
    // Create a sweet for purchase/restock tests
    const testSweet = global.testUtils.generateTestSweet();
    const sweet = new Sweet(testSweet);
    await sweet.save();
    testSweetId = sweet._id;
  });

  afterEach(async () => {
    // Clean up test sweet
    await Sweet.findByIdAndDelete(testSweetId);
  });

  describe('POST /api/sweets/purchaseSweet/:id', () => {
    it('should purchase a sweet with valid quantity', async () => {
      const purchaseQuantity = 5;
      
      const res = await request(app)
        .post(`/api/sweets/${testSweetId}/purchase`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: purchaseQuantity });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toMatch(/purchase successful/i);
      expect(res.body.sweet.quantity).toBe(100 - purchaseQuantity);
    });

    it('should purchase a sweet with default quantity of 1', async () => {
      const res = await request(app)
        .post(`/api/sweets/${testSweetId}/purchase`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({});
      
      expect(res.statusCode).toBe(200);
      expect(res.body.sweet.quantity).toBe(99); // 100 - 1
    });

    it('should reject purchase with insufficient stock', async () => {
      const purchaseQuantity = 150; // More than available stock
      
      const res = await request(app)
        .post(`/api/sweets/${testSweetId}/purchase`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: purchaseQuantity });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/insufficient stock/i);
    });

    it('should reject purchase with invalid quantity', async () => {
      const res = await request(app)
        .post(`/api/sweets/${testSweetId}/purchase`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: -5 });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/quantity must be a positive integer/i);
    });

    it('should reject purchase with non-integer quantity', async () => {
      const res = await request(app)
        .post(`/api/sweets/${testSweetId}/purchase`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 5.5 });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/quantity must be a positive integer/i);
    });

    it('should reject purchase with invalid sweet ID', async () => {
      const invalidId = '507f1f77bcf86cd799439011';
      
      const res = await request(app)
        .post(`/api/sweets/${invalidId}/purchase`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 5 });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/insufficient stock or sweet not found/i);
    });
  });

  describe('POST /api/sweets/restockSweet/:id', () => {
    it('should restock a sweet (admin only)', async () => {
      const restockQuantity = 50;
      
      const res = await request(app)
        .post(`/api/sweets/${testSweetId}/restock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ quantity: restockQuantity });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toMatch(/restocked/i);
      expect(res.body.sweet.quantity).toBe(100 + restockQuantity);
    });

    it('should reject restock without admin token', async () => {
      const restockQuantity = 50;
      
      const res = await request(app)
        .post(`/api/sweets/${testSweetId}/restock`)
        .send({ quantity: restockQuantity });
      
      expect(res.statusCode).toBe(401);
    });

    it('should reject restock with user token', async () => {
      const restockQuantity = 50;
      
      const res = await request(app)
        .post(`/api/sweets/${testSweetId}/restock`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: restockQuantity });
      
      expect(res.statusCode).toBe(403);
    });

    it('should reject restock with invalid quantity', async () => {
      const res = await request(app)
        .post(`/api/sweets/${testSweetId}/restock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ quantity: -10 });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/quantity must be a positive integer/i);
    });

    it('should reject restock with invalid sweet ID', async () => {
      const invalidId = '507f1f77bcf86cd799439011';
      
      const res = await request(app)
        .post(`/api/sweets/${invalidId}/restock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ quantity: 50 });
      
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toMatch(/sweet not found/i);
    });
  });
});