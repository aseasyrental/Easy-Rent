import jwt from 'jsonwebtoken';
import config from '../config/index.js';

export function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}

export function requireEditor(req, res, next) {
  if (req.user?.role !== 'admin' && req.user?.role !== 'editor') {
    return res.status(403).json({ message: 'Editor access required' });
  }
  next();
}

export function optionalAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      req.user = jwt.verify(token, config.jwt.secret);
    }
  } catch {
    // Invalid token — treat as unauthenticated, not an error
  }
  next();
}

export function errorHandler(err, req, res, next) {
  console.error(err.stack);
  const status = err.status || 500;
  res.status(status).json({
    message: status >= 500 ? 'Internal Server Error' : err.message,
    status
  });
}
