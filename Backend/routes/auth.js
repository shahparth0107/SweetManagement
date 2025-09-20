const express = require('express')
const router = express.Router()
// ...existing code...

// Middleware to block login if already logged in
function blockIfAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return res.status(400).json({ message: 'Already logged in as user. Please logout first.' })
    }
    if (req.session && req.session.admin) {
        return res.status(400).json({ message: 'Already logged in as admin. Please logout first.' })
    }
    next()
}

// Apply middleware to login route
router.post('/login', blockIfAuthenticated, async (req, res) => {
    // ...existing login logic...
})

// ...existing code...