const express = require('express');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { machineId } = require('node-machine-id');
const database = require('../database/database');

const router = express.Router();

// Middleware to verify token and extract user info
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
    
    // Try to get machine ID if not provided
    if (clientHWID === 'unknown') {
      try {
        clientHWID = await machineId();
      } catch (e) {
        clientHWID = `ip_${clientIP}`;
      }
    }

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

// POST /api/sync - Receive game data from Lua script
router.post('/', verifyToken, async (req, res) => {
  try {
    const { player, inventory, timestamp, gameSession } = req.body;

    if (!player || !inventory) {
      return res.status(400).json({ error: 'Missing required data' });
    }

    // Validate player data
    if (!player.userId || !player.username) {
      return res.status(400).json({ error: 'Invalid player data' });
    }

    // Create or update player
    const playerData = {
      token_id: req.tokenData.id,
      roblox_user_id: player.userId,
      username: player.username,
      display_name: player.displayName || player.username,
      account_name: player.accountName || player.username,
      account_age: player.accountAge || 0,
      game_id: player.gameId || 0,
      game_name: player.gameName || 'Unknown Game'
    };

    const playerResult = await database.createOrUpdatePlayer(playerData);
    
    // Get player ID
    let playerId = playerResult.id;
    if (!playerId) {
      const existingPlayer = await database.getPlayer(player.userId);
      playerId = existingPlayer ? existingPlayer.id : null;
    }

    if (!playerId) {
      return res.status(500).json({ error: 'Failed to create/update player' });
    }

    // Save game data
    const gameData = {
      player_id: playerId,
      coins: inventory.coins || 0,
      fruits: inventory.fruits || {},
      eggs: inventory.eggs || {},
      pets: inventory.pets || {},
      mutations: inventory.mutations || {},
      session_duration: gameSession ? gameSession.duration : 0
    };

    await database.saveGameData(gameData);

    // Emit real-time update to connected clients
    const io = req.app.get('io');
    if (io) {
      io.to(`token_${req.tokenData.token}`).emit('dataUpdate', {
        player: playerData,
        inventory: inventory,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Data synced successfully',
      timestamp: new Date().toISOString(),
      player_id: playerId
    });

  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ 
      error: 'Sync failed',
      message: error.message 
    });
  }
});

// GET /api/sync/status - Get sync status
router.get('/status', verifyToken, async (req, res) => {
  try {
    const players = await database.getPlayersByToken(req.tokenData.id);
    
    const playerData = await Promise.all(players.map(async (player) => {
      const latestData = await database.getLatestGameData(player.id);
      return {
        ...player,
        latestSync: latestData ? latestData.timestamp : null,
        hasData: !!latestData
      };
    }));

    res.json({
      success: true,
      token: {
        created_at: req.tokenData.created_at,
        last_used: req.tokenData.last_used,
        hwid: req.tokenData.hwid,
        ip_address: req.tokenData.ip_address
      },
      players: playerData,
      totalPlayers: players.length
    });

  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({ 
      error: 'Failed to get status',
      message: error.message 
    });
  }
});

module.exports = router;
