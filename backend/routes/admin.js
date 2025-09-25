const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'zimpyfile';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '050042767';
const JWT_SECRET = process.env.JWT_SECRET || 'zebux-dashboard-secret';

// Admin login
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const token = jwt.sign(
        { username, role: 'admin' },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      res.json({
        success: true,
        token: token,
        message: 'Admin login successful',
        expiresIn: '24h'
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
    
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Middleware to verify admin token
const verifyAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing admin token' });
  }
  
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid admin token' });
  }
};

// Admin dashboard stats
router.get('/stats', verifyAdmin, (req, res) => {
  try {
    // Here you would fetch real stats from database
    const stats = {
      totalUsers: 156,
      activeTokens: 89,
      totalSyncs: 12847,
      onlineUsers: 23,
      todaySyncs: 1247,
      avgSyncInterval: 285, // seconds
      topUsers: [
        { username: 'Player1', syncs: 1247, lastSync: new Date().toISOString() },
        { username: 'Player2', syncs: 892, lastSync: new Date().toISOString() },
        { username: 'Player3', syncs: 654, lastSync: new Date().toISOString() }
      ],
      recentActivity: [
        { type: 'sync', username: 'Player1', timestamp: new Date().toISOString() },
        { type: 'token_generated', username: 'NewUser', timestamp: new Date().toISOString() },
        { type: 'sync', username: 'Player2', timestamp: new Date().toISOString() }
      ]
    };
    
    res.json({
      success: true,
      stats: stats
    });
    
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get all users (admin)
router.get('/users', verifyAdmin, (req, res) => {
  try {
    // Here you would fetch from database
    const users = [
      {
        id: 1,
        username: 'TestUser1',
        token: 'zebux_abc123',
        createdAt: new Date().toISOString(),
        lastSync: new Date().toISOString(),
        totalSyncs: 1247,
        isActive: true,
        ipAddress: '192.168.1.1',
        hwid: 'hwid_example_1'
      },
      {
        id: 2,
        username: 'TestUser2',
        token: 'zebux_def456',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        lastSync: new Date(Date.now() - 3600000).toISOString(),
        totalSyncs: 892,
        isActive: true,
        ipAddress: '192.168.1.2',
        hwid: 'hwid_example_2'
      }
    ];
    
    res.json({
      success: true,
      users: users,
      total: users.length
    });
    
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Ban/unban user
router.post('/users/:id/ban', verifyAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { banned, reason } = req.body;
    
    // Here you would update database
    console.log(`Admin ${req.admin.username} ${banned ? 'banned' : 'unbanned'} user ${id}:`, reason);
    
    res.json({
      success: true,
      message: `User ${banned ? 'banned' : 'unbanned'} successfully`,
      userId: parseInt(id),
      banned: banned,
      reason: reason || 'No reason provided'
    });
    
  } catch (error) {
    console.error('Admin ban error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Delete user token
router.delete('/users/:id/token', verifyAdmin, (req, res) => {
  try {
    const { id } = req.params;
    
    // Here you would delete from database
    console.log(`Admin ${req.admin.username} deleted token for user ${id}`);
    
    res.json({
      success: true,
      message: 'Token deleted successfully',
      userId: parseInt(id)
    });
    
  } catch (error) {
    console.error('Admin token delete error:', error);
    res.status(500).json({ error: 'Failed to delete token' });
  }
});

module.exports = router;
