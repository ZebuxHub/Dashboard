const jwt = require('jsonwebtoken');
const database = require('../database/database');

// Middleware to verify user tokens (for API access)
async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const tokenData = await database.getToken(token);
    
    if (!tokenData) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    if (tokenData.is_banned) {
      return res.status(403).json({ error: 'Token is banned' });
    }

    // Get client info
    const clientIP = req.ip || req.connection.remoteAddress;
    let clientHWID = req.headers['x-hwid'] || 'unknown';
    
    // Check HWID/IP locking (allow multiple devices for same token)
    if (tokenData.hwid && tokenData.hwid !== clientHWID) {
      // Allow if it's a new device but same IP range (for mobile/desktop combo)
      const tokenIP = tokenData.ip_address;
      const sameNetwork = tokenIP && clientIP && 
        tokenIP.split('.').slice(0, 3).join('.') === clientIP.split('.').slice(0, 3).join('.');
      
      if (!sameNetwork) {
        return res.status(403).json({ 
          error: 'Token locked to different device',
          message: 'This token is locked to a different device/network'
        });
      }
    }

    // Update token usage
    await database.updateTokenUsage(token, clientHWID, clientIP);

    req.tokenData = tokenData;
    req.clientHWID = clientHWID;
    req.clientIP = clientIP;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ error: 'Token verification failed' });
  }
}

// Middleware to verify admin tokens (for admin panel)
async function verifyAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No admin token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    
    if (!decoded.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.adminUser = decoded;
    next();
  } catch (error) {
    console.error('Admin verification error:', error);
    res.status(401).json({ error: 'Invalid admin token' });
  }
}

// Rate limiting middleware
function createRateLimit(windowMs, max, message) {
  const requests = new Map();
  
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old requests
    if (requests.has(clientIP)) {
      const clientRequests = requests.get(clientIP).filter(time => time > windowStart);
      requests.set(clientIP, clientRequests);
    } else {
      requests.set(clientIP, []);
    }
    
    const clientRequests = requests.get(clientIP);
    
    if (clientRequests.length >= max) {
      return res.status(429).json({
        error: 'Too many requests',
        message: message || 'Rate limit exceeded',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    clientRequests.push(now);
    next();
  };
}

// CORS middleware
function corsMiddleware(req, res, next) {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.FRONTEND_URL
  ].filter(Boolean);

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-HWID');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  next();
}

// Security headers middleware
function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Only set HSTS in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  next();
}

// Request logging middleware
function requestLogger(req, res, next) {
  const start = Date.now();
  const clientIP = req.ip || req.connection.remoteAddress;
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: clientIP,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString()
    };
    
    // Log to console in development, could be sent to logging service in production
    if (process.env.NODE_ENV === 'development') {
      console.log(`${logData.method} ${logData.url} - ${logData.status} - ${logData.duration} - ${logData.ip}`);
    }
  });
  
  next();
}

// Error handling middleware
function errorHandler(err, req, res, next) {
  console.error('Error:', err);
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' });
  }
  
  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      error: 'Validation error',
      details: err.message 
    });
  }
  
  // Database errors
  if (err.code === 'SQLITE_CONSTRAINT') {
    return res.status(409).json({ error: 'Data conflict' });
  }
  
  // Default error
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
}

module.exports = {
  verifyToken,
  verifyAdmin,
  createRateLimit,
  corsMiddleware,
  securityHeaders,
  requestLogger,
  errorHandler
};
