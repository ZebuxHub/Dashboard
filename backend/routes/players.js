const express = require('express');
const router = express.Router();

// Get all players
router.get('/', (req, res) => {
  try {
    // Here you would fetch from database
    // For now, return mock data
    const players = [
      {
        id: 1,
        username: 'TestPlayer1',
        displayName: 'Test Player 1',
        userId: 123456,
        token: 'zebux_example123',
        lastUpdate: new Date().toISOString(),
        gameData: {
          coins: 1500000,
          gems: 750,
          pets: 30,
          eggs: 15,
          mutations: 5
        },
        isOnline: true
      },
      {
        id: 2,
        username: 'TestPlayer2',
        displayName: 'Test Player 2',
        userId: 789012,
        token: 'zebux_example456',
        lastUpdate: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
        gameData: {
          coins: 2500000,
          gems: 1200,
          pets: 45,
          eggs: 8,
          mutations: 12
        },
        isOnline: false
      }
    ];
    
    res.json({
      success: true,
      players: players,
      total: players.length
    });
    
  } catch (error) {
    console.error('Players fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch players' });
  }
});

// Get specific player by ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // Here you would fetch from database
    // For now, return mock data
    const player = {
      id: parseInt(id),
      username: `Player${id}`,
      displayName: `Player ${id}`,
      userId: parseInt(id) * 1000,
      token: `zebux_player${id}`,
      lastUpdate: new Date().toISOString(),
      gameData: {
        coins: Math.floor(Math.random() * 5000000),
        gems: Math.floor(Math.random() * 2000),
        pets: Math.floor(Math.random() * 50),
        eggs: Math.floor(Math.random() * 20),
        mutations: Math.floor(Math.random() * 15)
      },
      history: [
        {
          timestamp: new Date().toISOString(),
          coins: Math.floor(Math.random() * 5000000),
          pets: Math.floor(Math.random() * 50)
        }
      ],
      isOnline: Math.random() > 0.5
    };
    
    res.json({
      success: true,
      player: player
    });
    
  } catch (error) {
    console.error('Player fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch player' });
  }
});

// Get player history
router.get('/:id/history', (req, res) => {
  try {
    const { id } = req.params;
    const { interval = 'hourly', limit = 24 } = req.query;
    
    // Generate mock historical data
    const history = [];
    const now = Date.now();
    const intervalMs = {
      'hourly': 60 * 60 * 1000,
      'daily': 24 * 60 * 60 * 1000,
      'weekly': 7 * 24 * 60 * 60 * 1000
    }[interval] || 60 * 60 * 1000;
    
    for (let i = 0; i < parseInt(limit); i++) {
      history.push({
        timestamp: new Date(now - (i * intervalMs)).toISOString(),
        coins: Math.floor(Math.random() * 5000000),
        gems: Math.floor(Math.random() * 2000),
        pets: Math.floor(Math.random() * 50),
        eggs: Math.floor(Math.random() * 20),
        mutations: Math.floor(Math.random() * 15)
      });
    }
    
    res.json({
      success: true,
      playerId: parseInt(id),
      interval: interval,
      history: history.reverse() // Oldest first
    });
    
  } catch (error) {
    console.error('Player history error:', error);
    res.status(500).json({ error: 'Failed to fetch player history' });
  }
});

module.exports = router;
