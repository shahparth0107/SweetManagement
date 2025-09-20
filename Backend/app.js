require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db'); // uses your config/db.js

const app = express();
const PORT = process.env.PORT || 6000;

// middleware
// app.use(cors());

app.use(express.json());
// app.use(express.urlencoded({ extended: true }));



// quick logger to debug route flow
app.use((req, res, next) => {
  const start = Date.now();
  const oldEnd = res.end;
  res.end = function (...args) {
    console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`);
    oldEnd.apply(this, args);
  };
  next();
});

// health
app.get('/', (_req, res) => res.send('OK'));

// PUBLIC auth routes (no auth middleware here!)
app.use('/api/auth', require('./routes/authroute'));
app.use('/api/sweets', require('./routes/sweetroute'));

// 404 (optional)
// app.use((_req, res) => res.status(404).json({ message: 'Not found' }));


// Export app for testing
module.exports = app;

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  // start after DB connects
  connectDB()
    .then(() => {
      app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
    })
    .catch((err) => {
      console.error('DB connect error:', err);
      process.exit(1);
    });
}
