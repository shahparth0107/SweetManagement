const jwt = require('jsonwebtoken');

module.exports = function auth(req, res, next) {
  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7).trim() : null;
  if (!token) return res.status(401).json({ message: 'Missing token' });

  try {
    const p = jwt.verify(token, process.env.JWT_SECRET);
    // use whichever claim you set when signing: sub OR userId
    req.user = { id: p.sub || p.userId, role: p.role, name: p.name };
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
