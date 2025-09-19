const mongoose = require("mongoose");

const sweetSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    imageUrl: { type: String, required: true }
}, { timestamps: true });

// in models/sweets.js
// sweetSchema.index({ name: 'text', description: 'text', category: 'text' });

module.exports = mongoose.model("Sweet", sweetSchema);