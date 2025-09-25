const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'zebux-dashboard-secret';

// Basic token validation middleware
const validateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Missing or invalid authorization header',
      message: 'Please provide a valid Bearer token'
    });
  }
  
  const token = authHeader.substring(7);
  
  if (!token || token.length < 10) {
    return res.status(401).json({ 
      error: 'Invalid token format',
      message: 'Token must be at least 10 characters long'
    });
  }
  
  // For Zebux tokens (from Lua script)
  if (token.startsWith('zebux_')) {
    req.token = token;
    req.tokenType = 'zebux';
    return next();
  }
  
  // For JWT tokens (admin/web)
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    req.token = token;
    req.tokenType = 'jwt';
    next();
  } catch (error) {
    return res.status(401).json({ 
      error: 'Invalid JWT token',
      message: 'Token verification failed'
    });
  }
};

// Admin-only middleware
const requireAdmin = (req, res, next) => {
  if (req.tokenType !== 'jwt' || !req.user || req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Admin access required',
      message: 'This endpoint requires admin privileges'
    });
  }
  next();
};

// Rate limiting helper
const createRateLimit = (windowMs, max, message) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!requests.has(key)) {
      requests.set(key, []);
    }
    
    const userRequests = requests.get(key);
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(time => now - time < windowMs);
    requests.set(key, validRequests);
    
    if (validRequests.length >= max) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: message || 'Too many requests, please try again later',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    validRequests.push(now);
    next();
  };
};

module.exports = {
  validateToken,
  requireAdmin,
  createRateLimit
};
