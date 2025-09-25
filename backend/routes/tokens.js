const express = require('express');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const database = require('../database/database');

const router = express.Router();

// Generate a secure random token
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// POST /api/tokens/generate - Generate a new token
router.post('/generate', async (req, res) => {
  try {
    const { hwid, metadata } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress;
    
    // Generate unique token
    let token;
    let attempts = 0;
    const maxAttempts = 5;
    
    do {
      token = generateToken();
      attempts++;
      
      // Check if token already exists
      const existing = await database.getToken(token);
      if (!existing) break;
      
      if (attempts >= maxAttempts) {
        return res.status(500).json({ error: 'Failed to generate unique token' });
      }
    } while (attempts < maxAttempts);

    // Create token in database
    const tokenData = {
      token,
      hwid: hwid || 'unknown',
      ip_address: clientIP,
      metadata: metadata || {}
    };

    const result = await database.createToken(tokenData);

    res.json({
      success: true,
      token: token,
      message: 'Token generated successfully',
      instructions: {
        usage: 'Add this token to your Lua script',
        example: `WebsiteSync.Init({
    token = "${token}",
    apiUrl = "${req.protocol}://${req.get('host')}/api",
    syncInterval = 5 * 60,
    autoStart = true
})`
      }
    });

  } catch (error) {
    console.error('Token generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate token',
      message: error.message 
    });
  }
});

// GET /api/tokens/validate/:token - Validate a token
router.get('/validate/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const tokenData = await database.getToken(token);
    
    if (!tokenData) {
      return res.status(404).json({ 
        valid: false, 
        error: 'Token not found' 
      });
    }

    if (tokenData.is_banned) {
      return res.status(403).json({ 
        valid: false, 
        error: 'Token is banned' 
      });
    }

    // Get associated players
    const players = await database.getPlayersByToken(tokenData.id);

    res.json({
      valid: true,
      token: {
        created_at: tokenData.created_at,
        last_used: tokenData.last_used,
        hwid: tokenData.hwid,
        ip_address: tokenData.ip_address
      },
      players: players.length,
      message: 'Token is valid'
    });

  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({ 
      error: 'Validation failed',
      message: error.message 
    });
  }
});

// POST /api/tokens/test - Test token with sample data
router.post('/test', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Validate token
    const tokenData = await database.getToken(token);
    
    if (!tokenData) {
      return res.status(404).json({ error: 'Token not found' });
    }

    if (tokenData.is_banned) {
      return res.status(403).json({ error: 'Token is banned' });
    }

    // Create test data
    const testData = {
      player: {
        userId: 123456789,
        username: "TestUser",
        displayName: "Test User",
        accountAge: 100,
        gameId: 1234567890,
        gameName: "Test Game"
      },
      inventory: {
        coins: 1000000,
        fruits: {
          "Apple": 50,
          "Orange": 25,
          "Banana": 75
        },
        eggs: {
          "BasicEgg": 10,
          "RareEgg": 5,
          "LegendEgg": 2
        },
        pets: {
          counts: {
            "Dog": 3,
            "Cat": 2,
            "Dragon": 1
          },
          speeds: {
            "Dog": { total: 150, count: 3, average: 50, individual: [45, 50, 55] },
            "Cat": { total: 120, count: 2, average: 60, individual: [55, 65] },
            "Dragon": { total: 200, count: 1, average: 200, individual: [200] }
          }
        },
        mutations: {
          "Golden": 2,
          "Diamond": 1,
          "Fire": 1
        }
      },
      timestamp: Date.now(),
      gameSession: {
        duration: 3600
      }
    };

    // Try to sync test data
    const playerData = {
      token_id: tokenData.id,
      roblox_user_id: testData.player.userId,
      username: testData.player.username,
      display_name: testData.player.displayName,
      account_name: testData.player.username,
      account_age: testData.player.accountAge,
      game_id: testData.player.gameId,
      game_name: testData.player.gameName
    };

    await database.createOrUpdatePlayer(playerData);

    res.json({
      success: true,
      message: 'Token test successful',
      testData: testData,
      instructions: 'Test data has been synced to your dashboard'
    });

  } catch (error) {
    console.error('Token test error:', error);
    res.status(500).json({ 
      error: 'Test failed',
      message: error.message 
    });
  }
});

module.exports = router;
