require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/users');

const admins = [
  { username: 'Admin',  email: 'admin@example.com',  password: 'Admin12345' },
  { username: 'Owner',  email: 'owner@example.com',  password: 'Owner12345' },
  // add more here
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    for (const a of admins) {
      const email = a.email.toLowerCase().trim();
      const hash = await bcrypt.hash(a.password, 10);
      const doc = await User.findOneAndUpdate(
        { email },
        { $set: { username: a.username.trim(), email, password: hash, role: 'admin' } },
        { new: true, upsert: true }
      );
      console.log(`✅ admin ready: ${doc.username} <${doc.email}>`);
    }
    await mongoose.disconnect();
    process.exit(0);
  } catch (e) {
    console.error('error', e);
    process.exit(1);
  }
})();
