const express = require('express');
const router = express.Router();

// Middleware to validate token (simplified)
const validateToken = (req, res, next) => {
  console.log('🔍 Headers:', req.headers);
  
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ Missing or invalid auth header:', authHeader);
    return res.status(401).json({ error: 'Missing or invalid token' });
  }
  
  const token = authHeader.substring(7);
  if (!token || token.length < 10) {
    console.log('❌ Invalid token format:', token);
    return res.status(401).json({ error: 'Invalid token format' });
  }
  
  console.log('✅ Token validated:', token.substring(0, 10) + '...');
  req.token = token;
  next();
};

// Sync endpoint - receive data from Lua script
router.post('/', validateToken, async (req, res) => {
  try {
    console.log('🔍 Raw request body:', JSON.stringify(req.body, null, 2));
    
    const { player, inventory, gameData, timestamp, username: legacyUsername, userId: legacyUserId } = req.body;
    
    console.log('🔍 Extracted data:', {
      player,
      inventory: inventory ? 'present' : 'missing',
      gameData,
      timestamp,
      legacyUsername,
      legacyUserId
    });
    
    // Extract player info - support both new and legacy formats
    const username = player?.username || player?.displayName || legacyUsername;
    const userId = player?.userId || legacyUserId;
    const displayName = player?.displayName || username;
    
    console.log('🔍 Player info:', { username, userId, displayName });
    
    if (!username || !userId) {
      console.log('❌ Missing required fields:', { username, userId });
      return res.status(400).json({ 
        error: 'Missing required fields - need username and userId',
        received: { username, userId },
        playerObject: player,
        body: req.body
      });
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
