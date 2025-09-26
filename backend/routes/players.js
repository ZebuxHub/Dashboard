const express = require('express');
const router = express.Router();

// Store for real player data (in production, use database)
let playersData = [];

// Get all players
router.get('/', (req, res) => {
  try {
    console.log('📊 Fetching players data, count:', playersData.length);
    
    // Return real synced data
    res.json(playersData);
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ error: 'Failed to fetch players' });
  }
});

// Add or update player data (called from sync endpoint)
router.updatePlayer = (playerData) => {
  try {
    const existingIndex = playersData.findIndex(p => p.userId === playerData.userId);
    
    if (existingIndex >= 0) {
      // Update existing player
      playersData[existingIndex] = {
        ...playersData[existingIndex],
        ...playerData,
        lastUpdate: new Date().toISOString()
      };
      console.log('📊 Updated player:', playerData.username);
    } else {
      // Add new player
      playersData.push({
        ...playerData,
        id: playersData.length + 1,
        lastUpdate: new Date().toISOString()
      });
      console.log('📊 Added new player:', playerData.username);
    }
    
    // Keep only last 100 players to prevent memory issues
    if (playersData.length > 100) {
      playersData = playersData.slice(-100);
    }
    
    return true;
  } catch (error) {
    console.error('Error updating player data:', error);
    return false;
  }
};

// Get player by ID
router.get('/:id', (req, res) => {
  try {
    const playerId = parseInt(req.params.id);
    const player = playersData.find(p => p.id === playerId);
    
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    res.json(player);
  } catch (error) {
    console.error('Error fetching player:', error);
    res.status(500).json({ error: 'Failed to fetch player' });
  }
});

module.exports = router;
