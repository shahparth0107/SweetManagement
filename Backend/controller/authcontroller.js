const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/users");


const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-ZaLz\d]{8,}$/; // Minimum eight characters, at least one letter and one number
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

function validateInput(body){
    const name = (body.username || "").toString().trim();
    const email = (body.email || "").toString().trim().toLowerCase();
    const password = (body.password || "").toString();
    
    if(!name || !email || !password){
        return { status: false, message: "All fields are required" };
    }
    if(!emailRegex.test(email)){
        return { status: false, message: "Invalid email format" };
    }
    if(!passwordRegex.test(password)){
        return { status: false, message: "Password must be at least 8 characters long and contain at least one letter and one number" };
    }
    return { status: true };
}

exports.register = async (req, res) => {
    const { username, email, password } = req.body;
    const validation = validateInput(req.body);
    if(!validation.status){
        return res.status(400).json({ message: validation.message });
    }
    try {
        let user = await User.findOne({ email: email.toLowerCase() });
        if (user) {
            return res.status(400).json({ message: "User already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        user = new User({ 
            username, 
            email: email.toLowerCase(), 
            password: hashedPassword, 
            role: "user" });

        await user.save();
        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

exports.login = async (req, res) => {
    try {
        // Block login if already authenticated via JWT
        const hdr = req.headers.authorization || '';
        const token = hdr.startsWith('Bearer ') ? hdr.slice(7).trim() : null;
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                return res.status(400).json({ error: "Already logged in. Please logout first." });
            } catch (e) {
                // ignore invalid/expired token, allow login
            }
        }

        const email = (req.body.email || "").toString().toLowerCase();
        const password = (req.body.password || "").toString();


        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: "Invalid password" });
        }

        // Generate a new token with both userId and role
        const tokenOut = jwt.sign(
            { 
                userId: user._id.toString(),
                role: user.role 
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            message: "Login successful",
            user: {
                _id: user._id.toString(),
                email: user.email,
                username: user.username,
                role: user.role,
                token: tokenOut
            }
        });

    } catch (e) {
        console.error("Login Error:", e);
        res.status(500).json({ error: "Internal Server Error" });
    }
}