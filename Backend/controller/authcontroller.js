const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/users");


const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/; // Minimum eight characters, at least one letter and one number
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
  if (!validation.status) {
    return res.status(400).json({ message: validation.message });
  }

  try {
    // Ensure unique email
    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // IMPORTANT: do NOT hash here; let the model pre-save hook hash it
    user = new User({
      username,
      email: email.toLowerCase(),
      password,          // raw password; model hook will hash
      role: 'user',
    });

    await user.save();
    return res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Register Error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};


exports.login = async (req, res) => {
    try {
        
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
        const token = jwt.sign(
            { 
                userId: user._id.toString(), // Ensure userId is a string
                role: user.role 
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Update user's token in database
        // await User.findByIdAndUpdate(user._id, { token });

        // Send response with user data and token
        res.status(200).json({
            message: "Login successful",
            user: {
                _id: user._id.toString(), // Ensure _id is a string
                email: user.email,
                username: user.username,
                role: user.role,
                token: token // Include token in user object
            }
        });

    } catch (e) {
        console.error("Login Error:", e);
        res.status(500).json({ error: "Internal Server Error" });
    }
}