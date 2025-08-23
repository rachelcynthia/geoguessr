// middleware/auth.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id? (registered), role, sub, jti, exp, ... }
    req.userId = typeof decoded.id === 'number' ? decoded.id : null; // for registered users
    next();
  } catch {
    return res.status(403).json({ error: 'Invalid token' });
  }
}

function requireNonGuest(req, res, next) {
  if (req.user?.role === 'guest') {
    return res.status(403).json({ error: 'Guests cannot perform this action' });
  }
  next();
}

module.exports = { authMiddleware, requireNonGuest };
