const Sweet = require("../models/sweets");

exports.createSweet = async (req, res) => {
    try {
        const { name, description, price, category , imageUrl, quantity } = req.body;
        if (!name || !description || price < 0 || !category || !imageUrl || quantity == null) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const sweet = new Sweet ({ name, price, description, category, imageUrl, quantity });
        if (sweet.name) {
            return res.status(400).json({ message: "sweet already exists" });
        }
        await sweet.save();
        res.status(201).json({ 
            message: "Sweet created successfully", sweet 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};


exports.getSweets = async( req, res) =>{
    try{
        const sweets = await Sweet.find();
        res.status(200).json({ sweets });

    }
    catch(err){
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
}

exports.updateSweet = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, category , imageUrl, quantity } = req.body;
        if (!name || !description || price < 0 || !category || quantity == null || !imageUrl) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const sweet = await Sweet.findByIdAndUpdate(id, { name, description, price, category, quantity, imageUrl }, { new: true });
        if (!sweet) {
            return res.status(404).json({ message: "Sweet not found" });
        }
        res.status(200).json({ message: "Sweet updated successfully", sweet });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

exports.deleteSweet = async (req, res) =>{
    try{
        const {id} = req.params;
        const sweet = await Sweet.findByIdAndDelete(id);
        if(!sweet){
            return res.status(404).json({ message: "Sweet not found" });
        }
        res.status(200).json({ message: "Sweet deleted successfully" });
    }
    catch(err){
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// exports.searchSweet = async (req, res)=> {
//     try{
//         const {name, category, minprice, maxprice} = req.query;
//         const filer = {};
//         if(!name){
//             return res.status(400).json({ message: "Input is required" });
//         }
//         if(!category){
//             return res.status(400).json({ message: "Input is required" });
//         }
//         if(!minprice || !maxprice){
//             return res.status(400).json({ message: "Input is required" });
//         }
//         const sweets = await Sweet.find({ name: { $regex: name, $options: 'i' } });
//         // const sweets = await Sweet.find({ name: { $regex: category, $options: 'i' } });

//         res.status(200).json({ sweets });
//     }
//     catch(err){
//         console.error(err);
//         res.status(500).json({ message: "Server error" });
//     }
// };


// controller/sweetcontroller.js

exports.searchSweet = async (req, res) => {
  try {
    // accept either ?q= or ?keywords=
    const q = (req.query.q ?? req.query.keywords ?? '').toString();
    const categoryQ = (req.query.category ?? '').toString().trim();

    // support both minprice/minPrice & maxprice/maxPrice
    const minQ = req.query.minprice ?? req.query.minPrice;
    const maxQ = req.query.maxprice ?? req.query.maxPrice;

    // optional: only return items with quantity > 0
    const onlyInStock = (req.query.instock === '1' || req.query.instock === 'true');

    // build keywords array (comma-separated)
    const keywords = q
      .split(',')
      .map(k => k.trim())
      .filter(Boolean); // remove empties

    const and = [];

    // require ALL keywords to match (each keyword can match name OR description OR category)
    if (keywords.length) {
      const perKeywordOr = keywords.map(kw => ({
        $or: [
          { name:        { $regex: kw, $options: 'i' } },
          { description: { $regex: kw, $options: 'i' } },
          { category:    { $regex: kw, $options: 'i' } },
        ]
      }));
      and.push(...perKeywordOr); // AND all keywords
    }

    if (categoryQ) {
      and.push({ category: { $regex: categoryQ, $options: 'i' } });
    }

    const price = {};
    if (minQ !== undefined) {
      const min = Number(minQ);
      if (Number.isNaN(min) || min < 0) return res.status(400).json({ message: 'minprice must be a number ≥ 0' });
      price.$gte = min;
    }
    if (maxQ !== undefined) {
      const max = Number(maxQ);
      if (Number.isNaN(max) || max < 0) return res.status(400).json({ message: 'maxprice must be a number ≥ 0' });
      price.$lte = max;
    }
    if (price.$gte !== undefined && price.$lte !== undefined && price.$gte > price.$lte) {
      return res.status(400).json({ message: 'minprice cannot be greater than maxprice' });
    }
    if (Object.keys(price).length) and.push({ price });

    if (onlyInStock) {
      and.push({ quantity: { $gt: 0 } });
    }

    // if nothing provided, ask for at least one filter
    if (!and.length) {
      return res.status(400).json({ message: 'Provide at least one of: q/keywords, category, minprice, maxprice, instock' });
    }

    const filter = and.length === 1 ? and[0] : { $and: and };

    const sweets = await Sweet.find(filter).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ sweets, total: sweets.length, filter });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.purchaseSweet = async (req, res) => {
  try {
    const { id } = req.params;
    const qty = Number(req.body?.quantity ?? 1);
    if (!Number.isInteger(qty) || qty <= 0) {
      return res.status(400).json({ message: "quantity must be a positive integer" });
    }

    // atomic: only decrement if enough stock
    const sweet = await Sweet.findOneAndUpdate(
      { _id: id, quantity: { $gte: qty } },
      { $inc: { quantity: -qty } },
      { new: true }
    );
    if (!sweet) return res.status(400).json({ message: "Insufficient stock or sweet not found" });

    return res.status(200).json({ message: "Purchase successful", sweet });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
};

// restock (admin only)
exports.restockSweet = async (req, res) => {
  try {
    const { id } = req.params;
    const qty = Number(req.body?.quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      return res.status(400).json({ message: "quantity must be a positive integer" });
    }

    const sweet = await Sweet.findByIdAndUpdate(
      id,
      { $inc: { quantity: qty } },
      { new: true }
    );
    if (!sweet) return res.status(404).json({ message: "Sweet not found" });

    return res.status(200).json({ message: "Restocked", sweet });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Server error" });
  }
};
