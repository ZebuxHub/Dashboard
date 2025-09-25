const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const database = require('../database/database');

const router = express.Router();

// Admin authentication middleware
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

// POST /api/admin/login - Admin login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Get admin user
    let admin = await database.getAdmin(username);
    
    // If no admin exists and this is the default admin, create it
    if (!admin && username === 'user' && password === 'password') {
      const hashedPassword = await bcrypt.hash('password', 10);
      await database.createAdmin('user', hashedPassword);
      admin = await database.getAdmin('user');
    }

    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await database.updateAdminLogin(username);

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: admin.id, 
        username: admin.username, 
        isAdmin: true 
      },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token: token,
      admin: {
        id: admin.id,
        username: admin.username,
        lastLogin: admin.last_login
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ 
      error: 'Login failed',
      message: error.message 
    });
  }
});

// GET /api/admin/dashboard - Get admin dashboard data
router.get('/dashboard', verifyAdmin, async (req, res) => {
  try {
    // Get system statistics
    const stats = await database.getStats();

    // Get recent activity (last 24 hours)
    const recentActivity = await database.db.all(`
      SELECT 
        p.username,
        p.account_name,
        gd.timestamp,
        gd.coins,
        t.token,
        t.ip_address,
        t.last_used
      FROM game_data gd
      JOIN players p ON gd.player_id = p.id
      JOIN tokens t ON p.token_id = t.id
      WHERE gd.timestamp > datetime('now', '-24 hours')
      ORDER BY gd.timestamp DESC
      LIMIT 50
    `);

    // Get token usage statistics
    const tokenStats = await database.db.all(`
      SELECT 
        t.token,
        t.created_at,
        t.last_used,
        t.is_banned,
        t.ip_address,
        COUNT(p.id) as player_count,
        COUNT(gd.id) as sync_count
      FROM tokens t
      LEFT JOIN players p ON t.id = p.token_id
      LEFT JOIN game_data gd ON p.id = gd.player_id
      GROUP BY t.id
      ORDER BY t.last_used DESC
    `);

    res.json({
      success: true,
      stats: stats,
      recentActivity: recentActivity,
      tokenStats: tokenStats,
      serverInfo: {
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform,
        memory: process.memoryUsage()
      }
    });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ 
      error: 'Failed to get dashboard data',
      message: error.message 
    });
  }
});

// GET /api/admin/tokens - Get all tokens
router.get('/tokens', verifyAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, banned = null } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    let params = [];

    if (banned !== null) {
      whereClause = 'WHERE t.is_banned = ?';
      params.push(banned === 'true');
    }

    const tokens = await database.db.all(`
      SELECT 
        t.*,
        COUNT(p.id) as player_count,
        COUNT(gd.id) as sync_count,
        MAX(gd.timestamp) as last_sync
      FROM tokens t
      LEFT JOIN players p ON t.id = p.token_id
      LEFT JOIN game_data gd ON p.id = gd.player_id
      ${whereClause}
      GROUP BY t.id
      ORDER BY t.last_used DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    // Get total count
    const totalResult = await database.db.get(`
      SELECT COUNT(*) as total FROM tokens t ${whereClause}
    `, params);

    res.json({
      success: true,
      tokens: tokens,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalResult.total,
        pages: Math.ceil(totalResult.total / limit)
      }
    });

  } catch (error) {
    console.error('Admin get tokens error:', error);
    res.status(500).json({ 
      error: 'Failed to get tokens',
      message: error.message 
    });
  }
});

// PUT /api/admin/tokens/:token/ban - Ban/unban a token
router.put('/tokens/:token/ban', verifyAdmin, async (req, res) => {
  try {
    const { token } = req.params;
    const { banned = true, reason } = req.body;

    const success = await database.banToken(token, banned);
    
    if (!success) {
      return res.status(404).json({ error: 'Token not found' });
    }

    res.json({
      success: true,
      message: banned ? 'Token banned successfully' : 'Token unbanned successfully',
      token: token,
      banned: banned,
      reason: reason || null
    });

  } catch (error) {
    console.error('Admin ban token error:', error);
    res.status(500).json({ 
      error: 'Failed to ban/unban token',
      message: error.message 
    });
  }
});

// GET /api/admin/players - Get all players
router.get('/players', verifyAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    let params = [];

    if (search) {
      whereClause = 'WHERE p.username LIKE ? OR p.account_name LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }

    const players = await database.db.all(`
      SELECT 
        p.*,
        t.token,
        t.is_banned as token_banned,
        COUNT(gd.id) as sync_count,
        MAX(gd.timestamp) as last_sync,
        MAX(gd.coins) as max_coins
      FROM players p
      JOIN tokens t ON p.token_id = t.id
      LEFT JOIN game_data gd ON p.id = gd.player_id
      ${whereClause}
      GROUP BY p.id
      ORDER BY p.updated_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    // Get total count
    const totalResult = await database.db.get(`
      SELECT COUNT(*) as total FROM players p ${whereClause}
    `, params.slice(0, -2)); // Remove limit and offset params

    res.json({
      success: true,
      players: players,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalResult.total,
        pages: Math.ceil(totalResult.total / limit)
      }
    });

  } catch (error) {
    console.error('Admin get players error:', error);
    res.status(500).json({ 
      error: 'Failed to get players',
      message: error.message 
    });
  }
});

// GET /api/admin/analytics - Get analytics data
router.get('/analytics', verifyAdmin, async (req, res) => {
  try {
    const { days = 7 } = req.query;

    // Get daily sync counts
    const dailySyncs = await database.db.all(`
      SELECT 
        DATE(timestamp) as date,
        COUNT(*) as syncs,
        COUNT(DISTINCT player_id) as active_players
      FROM game_data 
      WHERE timestamp > datetime('now', '-${days} days')
      GROUP BY DATE(timestamp)
      ORDER BY date ASC
    `);

    // Get hourly sync counts for today
    const hourlySyncs = await database.db.all(`
      SELECT 
        strftime('%H', timestamp) as hour,
        COUNT(*) as syncs
      FROM game_data 
      WHERE DATE(timestamp) = DATE('now')
      GROUP BY strftime('%H', timestamp)
      ORDER BY hour ASC
    `);

    // Get top games
    const topGames = await database.db.all(`
      SELECT 
        game_name,
        COUNT(DISTINCT p.id) as player_count,
        COUNT(gd.id) as sync_count
      FROM players p
      LEFT JOIN game_data gd ON p.id = gd.player_id
      WHERE p.game_name IS NOT NULL AND p.game_name != 'Unknown Game'
      GROUP BY game_name
      ORDER BY player_count DESC
      LIMIT 10
    `);

    // Get growth metrics
    const growthMetrics = await database.db.get(`
      SELECT 
        COUNT(DISTINCT CASE WHEN t.created_at > datetime('now', '-7 days') THEN t.id END) as new_tokens_week,
        COUNT(DISTINCT CASE WHEN p.created_at > datetime('now', '-7 days') THEN p.id END) as new_players_week,
        COUNT(DISTINCT CASE WHEN gd.timestamp > datetime('now', '-24 hours') THEN gd.player_id END) as active_players_day
      FROM tokens t
      LEFT JOIN players p ON t.id = p.token_id
      LEFT JOIN game_data gd ON p.id = gd.player_id
    `);

    res.json({
      success: true,
      analytics: {
        dailySyncs: dailySyncs,
        hourlySyncs: hourlySyncs,
        topGames: topGames,
        growth: growthMetrics
      }
    });

  } catch (error) {
    console.error('Admin analytics error:', error);
    res.status(500).json({ 
      error: 'Failed to get analytics',
      message: error.message 
    });
  }
});

// POST /api/admin/broadcast - Broadcast message to all connected clients
router.post('/broadcast', verifyAdmin, async (req, res) => {
  try {
    const { message, type = 'info' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get io instance and broadcast
    const io = req.app.get('io');
    if (io) {
      io.emit('adminBroadcast', {
        message: message,
        type: type,
        timestamp: new Date().toISOString(),
        from: 'Admin'
      });
    }

    res.json({
      success: true,
      message: 'Broadcast sent successfully'
    });

  } catch (error) {
    console.error('Admin broadcast error:', error);
    res.status(500).json({ 
      error: 'Failed to send broadcast',
      message: error.message 
    });
  }
});

module.exports = router;
