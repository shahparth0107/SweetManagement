const mongoose = require('mongoose');
const User = require('../models/users');
const Sweet = require('../models/sweets');
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

describe('User Model', () => {
  afterEach(async () => {
    await User.deleteMany({ email: /test.*@example\.com/ });
  });

  describe('User Creation', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        username: 'testuser',
        email: 'testuser@example.com',
        password: 'Test1234'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.username).toBe(userData.username);
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.password).not.toBe(userData.password); // Password should be hashed
      expect(savedUser.password.length).toBeGreaterThan(20); // bcrypt hash length
      expect(savedUser.role).toBe('user');
      expect(savedUser.createdAt).toBeDefined();
      expect(savedUser.updatedAt).toBeDefined();
    });

    it('should set default role as user', async () => {
      const userData = {
        username: 'testuser2',
        email: 'testuser2@example.com',
        password: 'Test1234'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.role).toBe('user');
    });

    it('should allow admin role to be set', async () => {
      const userData = {
        username: 'testadmin',
        email: 'testadmin@example.com',
        password: 'Test1234',
        role: 'admin'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.role).toBe('admin');
    });

    it('should reject invalid role', async () => {
      const userData = {
        username: 'testuser3',
        email: 'testuser3@example.com',
        password: 'Test1234',
        role: 'invalid_role'
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow();
    });
  });

  describe('User Validation', () => {
    it('should require username', async () => {
      const userData = {
        email: 'testuser4@example.com',
        password: 'Test1234'
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow();
    });

    it('should require email', async () => {
      const userData = {
        username: 'testuser5',
        password: 'Test1234'
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow();
    });

    it('should require password', async () => {
      const userData = {
        username: 'testuser6',
        email: 'testuser6@example.com'
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow();
    });

    it('should enforce unique username', async () => {
      const uniqueUsername = `uniquename_${Date.now()}`;
      const userData1 = {
        username: uniqueUsername,
        email: `user1_${Date.now()}@example.com`,
        password: 'Test1234'
      };

      const userData2 = {
        username: uniqueUsername,
        email: `user2_${Date.now()}@example.com`,
        password: 'Test1234'
      };

      const user1 = new User(userData1);
      await user1.save();

      const user2 = new User(userData2);
      await expect(user2.save()).rejects.toThrow();
      
      // Clean up
      await User.findByIdAndDelete(user1._id);
    });

    it('should enforce unique email', async () => {
      const uniqueEmail = `unique_${Date.now()}@example.com`;
      const userData1 = {
        username: `user1_${Date.now()}`,
        email: uniqueEmail,
        password: 'Test1234'
      };

      const userData2 = {
        username: `user2_${Date.now()}`,
        email: uniqueEmail,
        password: 'Test1234'
      };

      const user1 = new User(userData1);
      await user1.save();

      const user2 = new User(userData2);
      await expect(user2.save()).rejects.toThrow();
      
      // Clean up
      await User.findByIdAndDelete(user1._id);
    });
  });

  describe('User Methods', () => {
    it('should hash password before saving', async () => {
      const userData = {
        username: 'testuser7',
        email: 'testuser7@example.com',
        password: 'Test1234'
      };

      const user = new User(userData);
      await user.save();

      expect(user.password).not.toBe(userData.password);
      expect(user.password.length).toBeGreaterThan(20); // bcrypt hash length
    });

    it('should compare password correctly', async () => {
      const userData = {
        username: 'testuser8',
        email: 'testuser8@example.com',
        password: 'Test1234'
      };

      const user = new User(userData);
      await user.save();

      const isMatch = await bcrypt.compare('Test1234', user.password);
      expect(isMatch).toBe(true);

      const isNotMatch = await bcrypt.compare('WrongPassword', user.password);
      expect(isNotMatch).toBe(false);
    });
  });
});

describe('Sweet Model', () => {
  afterEach(async () => {
    await Sweet.deleteMany({ name: /test.*sweet/i });
  });

  describe('Sweet Creation', () => {
    it('should create a sweet with valid data', async () => {
      const sweetData = {
        name: 'Test Sweet',
        description: 'A test sweet for testing',
        price: 10.99,
        category: 'Test Category',
        imageUrl: 'https://example.com/test-image.jpg',
        quantity: 100
      };

      const sweet = new Sweet(sweetData);
      const savedSweet = await sweet.save();

      expect(savedSweet._id).toBeDefined();
      expect(savedSweet.name).toBe(sweetData.name);
      expect(savedSweet.description).toBe(sweetData.description);
      expect(savedSweet.price).toBe(sweetData.price);
      expect(savedSweet.category).toBe(sweetData.category);
      expect(savedSweet.imageUrl).toBe(sweetData.imageUrl);
      expect(savedSweet.quantity).toBe(sweetData.quantity);
      expect(savedSweet.createdAt).toBeDefined();
      expect(savedSweet.updatedAt).toBeDefined();
    });
  });

  describe('Sweet Validation', () => {
    it('should require name', async () => {
      const sweetData = {
        description: 'A test sweet',
        price: 10.99,
        category: 'Test Category',
        imageUrl: 'https://example.com/test-image.jpg',
        quantity: 100
      };

      const sweet = new Sweet(sweetData);
      
      await expect(sweet.save()).rejects.toThrow();
    });

    it('should require description', async () => {
      const sweetData = {
        name: 'Test Sweet',
        price: 10.99,
        category: 'Test Category',
        imageUrl: 'https://example.com/test-image.jpg',
        quantity: 100
      };

      const sweet = new Sweet(sweetData);
      
      await expect(sweet.save()).rejects.toThrow();
    });

    it('should require price', async () => {
      const sweetData = {
        name: 'Test Sweet',
        description: 'A test sweet',
        category: 'Test Category',
        imageUrl: 'https://example.com/test-image.jpg',
        quantity: 100
      };

      const sweet = new Sweet(sweetData);
      
      await expect(sweet.save()).rejects.toThrow();
    });

    it('should require category', async () => {
      const sweetData = {
        name: 'Test Sweet',
        description: 'A test sweet',
        price: 10.99,
        imageUrl: 'https://example.com/test-image.jpg',
        quantity: 100
      };

      const sweet = new Sweet(sweetData);
      
      await expect(sweet.save()).rejects.toThrow();
    });

    it('should require imageUrl', async () => {
      const sweetData = {
        name: 'Test Sweet',
        description: 'A test sweet',
        price: 10.99,
        category: 'Test Category',
        quantity: 100
      };

      const sweet = new Sweet(sweetData);
      
      await expect(sweet.save()).rejects.toThrow();
    });

    it('should require quantity', async () => {
      const sweetData = {
        name: 'Test Sweet',
        description: 'A test sweet',
        price: 10.99,
        category: 'Test Category',
        imageUrl: 'https://example.com/test-image.jpg'
      };

      const sweet = new Sweet(sweetData);
      
      await expect(sweet.save()).rejects.toThrow();
    });

    it('should enforce minimum quantity of 0', async () => {
      const sweetData = {
        name: 'Test Sweet',
        description: 'A test sweet',
        price: 10.99,
        category: 'Test Category',
        imageUrl: 'https://example.com/test-image.jpg',
        quantity: -5
      };

      const sweet = new Sweet(sweetData);
      
      await expect(sweet.save()).rejects.toThrow();
    });

    it('should allow quantity of 0', async () => {
      const sweetData = {
        name: 'Test Sweet',
        description: 'A test sweet',
        price: 10.99,
        category: 'Test Category',
        imageUrl: 'https://example.com/test-image.jpg',
        quantity: 0
      };

      const sweet = new Sweet(sweetData);
      const savedSweet = await sweet.save();

      expect(savedSweet.quantity).toBe(0);
    });
  });

  describe('Sweet Data Types', () => {
    it('should handle string data correctly', async () => {
      const sweetData = {
        name: 'Test Sweet',
        description: 'A test sweet',
        price: 10.99,
        category: 'Test Category',
        imageUrl: 'https://example.com/test-image.jpg',
        quantity: 100
      };

      const sweet = new Sweet(sweetData);
      const savedSweet = await sweet.save();

      expect(typeof savedSweet.name).toBe('string');
      expect(typeof savedSweet.description).toBe('string');
      expect(typeof savedSweet.category).toBe('string');
      expect(typeof savedSweet.imageUrl).toBe('string');
    });

    it('should handle number data correctly', async () => {
      const sweetData = {
        name: 'Test Sweet',
        description: 'A test sweet',
        price: 10.99,
        category: 'Test Category',
        imageUrl: 'https://example.com/test-image.jpg',
        quantity: 100
      };

      const sweet = new Sweet(sweetData);
      const savedSweet = await sweet.save();

      expect(typeof savedSweet.price).toBe('number');
      expect(typeof savedSweet.quantity).toBe('number');
    });
  });

  describe('Sweet Timestamps', () => {
    it('should set createdAt and updatedAt timestamps', async () => {
      const sweetData = {
        name: 'Test Sweet',
        description: 'A test sweet',
        price: 10.99,
        category: 'Test Category',
        imageUrl: 'https://example.com/test-image.jpg',
        quantity: 100
      };

      const sweet = new Sweet(sweetData);
      const savedSweet = await sweet.save();

      expect(savedSweet.createdAt).toBeDefined();
      expect(savedSweet.updatedAt).toBeDefined();
      expect(savedSweet.createdAt).toBeInstanceOf(Date);
      expect(savedSweet.updatedAt).toBeInstanceOf(Date);
    });

    it('should update updatedAt when document is modified', async () => {
      const sweetData = {
        name: 'Test Sweet',
        description: 'A test sweet',
        price: 10.99,
        category: 'Test Category',
        imageUrl: 'https://example.com/test-image.jpg',
        quantity: 100
      };

      const sweet = new Sweet(sweetData);
      const savedSweet = await sweet.save();
      const originalUpdatedAt = savedSweet.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));

      savedSweet.name = 'Updated Test Sweet';
      const updatedSweet = await savedSweet.save();

      expect(updatedSweet.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      
      // Clean up
      await Sweet.findByIdAndDelete(savedSweet._id);
    });
  });
});
