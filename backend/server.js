const express = require('express');
const http = require('http');
const { Server: SocketIOServer } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Import routes and middleware
const authMiddleware = require('./middleware/auth');
const syncRoutes = require('./routes/sync');
const tokenRoutes = require('./routes/tokens');
const playerRoutes = require('./routes/players');
const adminRoutes = require('./routes/admin');
const luaRoutes = require('./routes/lua');

// Import database
const database = require('./database/database');

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"]
    }
  }
}));

app.use(compression());
app.use(morgan('combined'));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

// Rate limiting - More generous limits for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // limit each IP to 5000 requests per windowMs (increased)
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use('/api/', limiter);

// More generous rate limiting for sync endpoint
const syncLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 sync requests per minute (increased from 10)
  message: 'Too many sync requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/sync', syncLimiter);

// Separate rate limit for token generation (more generous)
const tokenLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // 50 token generations per 5 minutes
  message: 'Too many token generation attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/tokens', tokenLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from frontend build
const staticPath = path.join(__dirname, './frontend/dist');
console.log('📁 Static files path:', staticPath);
app.use(express.static(staticPath));

// API Routes
app.use('/api/sync', syncRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/lua', luaRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join room based on token
  socket.on('join', (token) => {
    if (token) {
      socket.join(`token_${token}`);
      console.log(`Socket ${socket.id} joined room token_${token}`);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io available to routes
app.set('io', io);

// Serve React app for all non-API routes
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, './frontend/dist/index.html');
  console.log('📄 Serving index.html from:', indexPath);
  
  // Check if file exists
  const fs = require('fs');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    console.error('❌ index.html not found at:', indexPath);
    res.status(404).send(`
      <html>
        <body>
          <h1>Frontend Not Found</h1>
          <p>Static files not available at: ${indexPath}</p>
          <p>Please check the build process.</p>
        </body>
      </html>
    `);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested resource was not found'
  });
});

// Initialize database and start server
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    console.log('🔄 Starting server initialization...');
    
    // Check if frontend files exist
    const fs = require('fs');
    const frontendPath = path.join(__dirname, './frontend/dist');
    const indexPath = path.join(frontendPath, 'index.html');
    
    console.log('📁 Checking frontend files...');
    console.log('Frontend path:', frontendPath);
    console.log('Index path:', indexPath);
    
    if (!fs.existsSync(frontendPath)) {
      console.warn('⚠️ Frontend dist folder not found, creating fallback...');
      fs.mkdirSync(frontendPath, { recursive: true });
      fs.writeFileSync(indexPath, `
        <!DOCTYPE html>
        <html>
          <head><title>Zebux Dashboard</title></head>
          <body>
            <h1>🚧 Frontend Building...</h1>
            <p>The frontend is being built. Please wait...</p>
          </body>
        </html>
      `);
    }

    // Initialize database
    console.log('🗄️ Initializing database...');
    await database.init();
    console.log('✅ Database initialized successfully');

    // Start server
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Zebux Dashboard running on port ${PORT}`);
      console.log(`📊 Dashboard: http://localhost:${PORT}`);
      console.log(`🔧 Admin Panel: http://localhost:${PORT}/admin`);
      console.log(`📡 API: http://localhost:${PORT}/api`);
      console.log(`🎮 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('✅ Server started successfully!');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    console.error('Stack trace:', error.stack);
    
    // Don't exit immediately, try to continue with basic functionality
    console.log('🔄 Attempting to start with minimal functionality...');
    
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`⚠️ Server running in fallback mode on port ${PORT}`);
    });
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();

module.exports = { app, server, io };
