const express = require('express');
const database = require('../database/database');

const router = express.Router();

// Middleware to verify token (same as sync.js)
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

    req.tokenData = tokenData;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ error: 'Token verification failed' });
  }
}

// GET /api/players - Get all players for the authenticated token
router.get('/', verifyToken, async (req, res) => {
  try {
    const players = await database.getPlayersByToken(req.tokenData.id);
    
    // Get latest data for each player
    const playersWithData = await Promise.all(players.map(async (player) => {
      const latestData = await database.getLatestGameData(player.id);
      return {
        ...player,
        latestData: latestData || null,
        lastSync: latestData ? latestData.timestamp : null
      };
    }));

    res.json({
      success: true,
      players: playersWithData,
      totalPlayers: players.length
    });

  } catch (error) {
    console.error('Get players error:', error);
    res.status(500).json({ 
      error: 'Failed to get players',
      message: error.message 
    });
  }
});

// GET /api/players/:playerId - Get specific player data
router.get('/:playerId', verifyToken, async (req, res) => {
  try {
    const { playerId } = req.params;
    const { hours = 24 } = req.query;

    // Verify player belongs to this token
    const players = await database.getPlayersByToken(req.tokenData.id);
    const player = players.find(p => p.id == playerId);
    
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Get latest data
    const latestData = await database.getLatestGameData(playerId);
    
    // Get historical data
    const historyData = await database.getGameDataHistory(playerId, parseInt(hours));

    res.json({
      success: true,
      player: {
        ...player,
        latestData: latestData || null,
        lastSync: latestData ? latestData.timestamp : null
      },
      history: historyData,
      totalDataPoints: historyData.length
    });

  } catch (error) {
    console.error('Get player error:', error);
    res.status(500).json({ 
      error: 'Failed to get player data',
      message: error.message 
    });
  }
});

// PUT /api/players/:playerId/name - Update player account name
router.put('/:playerId/name', verifyToken, async (req, res) => {
  try {
    const { playerId } = req.params;
    const { accountName } = req.body;

    if (!accountName || accountName.trim().length === 0) {
      return res.status(400).json({ error: 'Account name is required' });
    }

    // Verify player belongs to this token
    const players = await database.getPlayersByToken(req.tokenData.id);
    const player = players.find(p => p.id == playerId);
    
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Update player name
    const playerData = {
      token_id: req.tokenData.id,
      roblox_user_id: player.roblox_user_id,
      username: player.username,
      display_name: player.display_name,
      account_name: accountName.trim(),
      account_age: player.account_age,
      game_id: player.game_id,
      game_name: player.game_name
    };

    await database.createOrUpdatePlayer(playerData);

    res.json({
      success: true,
      message: 'Account name updated successfully',
      accountName: accountName.trim()
    });

  } catch (error) {
    console.error('Update player name error:', error);
    res.status(500).json({ 
      error: 'Failed to update player name',
      message: error.message 
    });
  }
});

// GET /api/players/:playerId/export - Export player data
router.get('/:playerId/export', verifyToken, async (req, res) => {
  try {
    const { playerId } = req.params;
    const { format = 'json', hours = 168 } = req.query; // Default 7 days

    // Verify player belongs to this token
    const players = await database.getPlayersByToken(req.tokenData.id);
    const player = players.find(p => p.id == playerId);
    
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Get historical data
    const historyData = await database.getGameDataHistory(playerId, parseInt(hours));

    const exportData = {
      player: player,
      dataPoints: historyData,
      exportedAt: new Date().toISOString(),
      totalDataPoints: historyData.length,
      timeRange: `${hours} hours`
    };

    if (format.toLowerCase() === 'csv') {
      // Convert to CSV format
      const csvHeaders = [
        'timestamp', 'coins', 'fruits_json', 'eggs_json', 
        'pets_json', 'mutations_json', 'session_duration'
      ];
      
      let csvContent = csvHeaders.join(',') + '\n';
      
      historyData.forEach(row => {
        const csvRow = [
          row.timestamp,
          row.coins,
          JSON.stringify(row.fruits).replace(/"/g, '""'),
          JSON.stringify(row.eggs).replace(/"/g, '""'),
          JSON.stringify(row.pets).replace(/"/g, '""'),
          JSON.stringify(row.mutations).replace(/"/g, '""'),
          row.session_duration
        ];
        csvContent += csvRow.join(',') + '\n';
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${player.username}_data_export.csv"`);
      res.send(csvContent);
    } else {
      // JSON format
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${player.username}_data_export.json"`);
      res.json(exportData);
    }

  } catch (error) {
    console.error('Export player data error:', error);
    res.status(500).json({ 
      error: 'Failed to export player data',
      message: error.message 
    });
  }
});

// GET /api/players/:playerId/stats - Get player statistics
router.get('/:playerId/stats', verifyToken, async (req, res) => {
  try {
    const { playerId } = req.params;

    // Verify player belongs to this token
    const players = await database.getPlayersByToken(req.tokenData.id);
    const player = players.find(p => p.id == playerId);
    
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Get all historical data for statistics
    const allData = await database.getGameDataHistory(playerId, 24 * 365); // 1 year

    if (allData.length === 0) {
      return res.json({
        success: true,
        stats: {
          totalSyncs: 0,
          firstSync: null,
          lastSync: null,
          averageCoins: 0,
          maxCoins: 0,
          totalFruits: 0,
          totalEggs: 0,
          totalPets: 0,
          totalMutations: 0
        }
      });
    }

    // Calculate statistics
    const stats = {
      totalSyncs: allData.length,
      firstSync: allData[0].timestamp,
      lastSync: allData[allData.length - 1].timestamp,
      averageCoins: Math.round(allData.reduce((sum, d) => sum + (d.coins || 0), 0) / allData.length),
      maxCoins: Math.max(...allData.map(d => d.coins || 0)),
      totalFruits: 0,
      totalEggs: 0,
      totalPets: 0,
      totalMutations: 0,
      growthRate: {
        coins: 0,
        fruits: 0,
        eggs: 0,
        pets: 0
      }
    };

    // Calculate totals from latest data
    const latestData = allData[allData.length - 1];
    if (latestData) {
      stats.totalFruits = Object.values(latestData.fruits || {}).reduce((sum, count) => sum + count, 0);
      stats.totalEggs = Object.values(latestData.eggs || {}).reduce((sum, count) => sum + count, 0);
      stats.totalMutations = Object.values(latestData.mutations || {}).reduce((sum, count) => sum + count, 0);
      
      if (latestData.pets && latestData.pets.counts) {
        stats.totalPets = Object.values(latestData.pets.counts).reduce((sum, count) => sum + count, 0);
      }
    }

    // Calculate growth rates (if we have at least 2 data points)
    if (allData.length >= 2) {
      const firstData = allData[0];
      const timeDiff = (new Date(latestData.timestamp) - new Date(firstData.timestamp)) / (1000 * 60 * 60 * 24); // days
      
      if (timeDiff > 0) {
        stats.growthRate.coins = Math.round(((latestData.coins || 0) - (firstData.coins || 0)) / timeDiff);
      }
    }

    res.json({
      success: true,
      stats: stats
    });

  } catch (error) {
    console.error('Get player stats error:', error);
    res.status(500).json({ 
      error: 'Failed to get player statistics',
      message: error.message 
    });
  }
});

module.exports = router;
