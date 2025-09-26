const express = require('express');
const router = express.Router();

// Middleware to validate token (simplified)
const validateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid token' });
  }
  
  const token = authHeader.substring(7);
  if (!token || token.length < 10) {
    return res.status(401).json({ error: 'Invalid token format' });
  }
  
  req.token = token;
  next();
};

// Sync endpoint - receive data from Lua script
router.post('/', validateToken, async (req, res) => {
  try {
    const { player, inventory, gameData, timestamp } = req.body;
    
    // Extract player info from new format
    const username = player?.username || player?.displayName;
    const userId = player?.userId;
    const displayName = player?.displayName;
    
    if (!username || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Use gameData if available, otherwise extract from inventory
    const finalGameData = gameData || {
      pets: inventory?.totalPets || 0,
      eggs: inventory?.totalEggs || 0,
      coins: inventory?.coins || 0,
      gems: inventory?.gems || 0
    };
    
    // Here you would save to database
    // For now, just log and broadcast via WebSocket
    console.log('📊 Received sync data:', {
      username,
      userId,
      timestamp: new Date((timestamp || Date.now() / 1000) * 1000).toISOString(),
      gameData: finalGameData,
      inventory: inventory ? {
        pets: inventory.pets?.counts || {},
        eggs: inventory.eggs || {},
        mutations: inventory.mutations || {}
      } : null
    });
    
    // Broadcast to connected clients via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.emit('playerUpdate', {
        token: req.token,
        username,
        displayName,
        userId,
        timestamp,
        gameData: finalGameData,
        inventory,
        lastUpdate: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      message: 'Data synced successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get player data endpoint
router.get('/player/:token', (req, res) => {
  const { token } = req.params;
  
  if (!token) {
    return res.status(400).json({ error: 'Token required' });
  }
  
  // Here you would fetch from database
  // For now, return mock data
  res.json({
    success: true,
    data: {
      username: 'MockPlayer',
      lastUpdate: new Date().toISOString(),
      gameData: {
        coins: 1000000,
        gems: 500,
        pets: 25,
        eggs: 10
      }
    }
  });
});

module.exports = router;
