const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
  constructor() {
    this.db = null;
    this.dbPath = path.join(__dirname, '../data/zebux.db');
  }

  async init() {
    return new Promise((resolve, reject) => {
      // Ensure data directory exists
      const dataDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Connect to database
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err);
          reject(err);
          return;
        }
        console.log('Connected to SQLite database');
        this.createTables().then(resolve).catch(reject);
      });
    });
  }

  async createTables() {
    return new Promise((resolve, reject) => {
      const tables = [
        // Users/Tokens table
        `CREATE TABLE IF NOT EXISTS tokens (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          token TEXT UNIQUE NOT NULL,
          user_id TEXT,
          hwid TEXT,
          ip_address TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_used DATETIME DEFAULT CURRENT_TIMESTAMP,
          is_banned BOOLEAN DEFAULT FALSE,
          metadata TEXT
        )`,

        // Players table
        `CREATE TABLE IF NOT EXISTS players (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          token_id INTEGER,
          roblox_user_id INTEGER UNIQUE,
          username TEXT NOT NULL,
          display_name TEXT,
          account_name TEXT,
          account_age INTEGER,
          game_id INTEGER,
          game_name TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (token_id) REFERENCES tokens (id)
        )`,

        // Game data snapshots
        `CREATE TABLE IF NOT EXISTS game_data (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          player_id INTEGER,
          coins REAL DEFAULT 0,
          fruits TEXT, -- JSON
          eggs TEXT,   -- JSON
          pets TEXT,   -- JSON
          mutations TEXT, -- JSON
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          session_duration INTEGER DEFAULT 0,
          FOREIGN KEY (player_id) REFERENCES players (id)
        )`,

        // Admin users
        `CREATE TABLE IF NOT EXISTS admin_users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_login DATETIME
        )`,

        // System settings
        `CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
      ];

      let completed = 0;
      const total = tables.length;

      tables.forEach((sql) => {
        this.db.run(sql, (err) => {
          if (err) {
            console.error('Error creating table:', err);
            reject(err);
            return;
          }
          completed++;
          if (completed === total) {
            console.log('All database tables created successfully');
            this.createIndexes().then(resolve).catch(reject);
          }
        });
      });
    });
  }

  async createIndexes() {
    return new Promise((resolve, reject) => {
      const indexes = [
        'CREATE INDEX IF NOT EXISTS idx_tokens_token ON tokens(token)',
        'CREATE INDEX IF NOT EXISTS idx_tokens_hwid ON tokens(hwid)',
        'CREATE INDEX IF NOT EXISTS idx_players_roblox_id ON players(roblox_user_id)',
        'CREATE INDEX IF NOT EXISTS idx_players_token ON players(token_id)',
        'CREATE INDEX IF NOT EXISTS idx_game_data_player ON game_data(player_id)',
        'CREATE INDEX IF NOT EXISTS idx_game_data_timestamp ON game_data(timestamp)'
      ];

      let completed = 0;
      const total = indexes.length;

      indexes.forEach((sql) => {
        this.db.run(sql, (err) => {
          if (err) {
            console.error('Error creating index:', err);
            reject(err);
            return;
          }
          completed++;
          if (completed === total) {
            console.log('All database indexes created successfully');
            resolve();
          }
        });
      });
    });
  }

  // Token operations
  async createToken(tokenData) {
    return new Promise((resolve, reject) => {
      const { token, hwid, ip_address, metadata } = tokenData;
      const sql = `INSERT INTO tokens (token, hwid, ip_address, metadata) VALUES (?, ?, ?, ?)`;
      
      this.db.run(sql, [token, hwid, ip_address, JSON.stringify(metadata || {})], function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve({ id: this.lastID, token });
      });
    });
  }

  async getToken(token) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM tokens WHERE token = ? AND is_banned = FALSE`;
      
      this.db.get(sql, [token], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        if (row && row.metadata) {
          try {
            row.metadata = JSON.parse(row.metadata);
          } catch (e) {
            row.metadata = {};
          }
        }
        resolve(row);
      });
    });
  }

  async updateTokenUsage(token, hwid, ip_address) {
    return new Promise((resolve, reject) => {
      const sql = `UPDATE tokens SET hwid = ?, ip_address = ?, last_used = CURRENT_TIMESTAMP WHERE token = ?`;
      
      this.db.run(sql, [hwid, ip_address, token], function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve(this.changes > 0);
      });
    });
  }

  async banToken(token, banned = true) {
    return new Promise((resolve, reject) => {
      const sql = `UPDATE tokens SET is_banned = ? WHERE token = ?`;
      
      this.db.run(sql, [banned, token], function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve(this.changes > 0);
      });
    });
  }

  // Player operations
  async createOrUpdatePlayer(playerData) {
    return new Promise((resolve, reject) => {
      const { token_id, roblox_user_id, username, display_name, account_name, account_age, game_id, game_name } = playerData;
      
      // First try to update existing player
      const updateSql = `UPDATE players SET 
        username = ?, display_name = ?, account_name = ?, account_age = ?, 
        game_id = ?, game_name = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE roblox_user_id = ?`;
      
      this.db.run(updateSql, [username, display_name, account_name, account_age, game_id, game_name, roblox_user_id], function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        if (this.changes > 0) {
          // Player updated
          resolve({ id: null, updated: true });
        } else {
          // Player doesn't exist, create new one
          const insertSql = `INSERT INTO players 
            (token_id, roblox_user_id, username, display_name, account_name, account_age, game_id, game_name) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
          
          this.db.run(insertSql, [token_id, roblox_user_id, username, display_name, account_name, account_age, game_id, game_name], function(err) {
            if (err) {
              reject(err);
              return;
            }
            resolve({ id: this.lastID, updated: false });
          });
        }
      });
    });
  }

  async getPlayersByToken(token_id) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM players WHERE token_id = ? ORDER BY updated_at DESC`;
      
      this.db.all(sql, [token_id], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows || []);
      });
    });
  }

  async getPlayer(roblox_user_id) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM players WHERE roblox_user_id = ?`;
      
      this.db.get(sql, [roblox_user_id], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row);
      });
    });
  }

  // Game data operations
  async saveGameData(gameData) {
    return new Promise((resolve, reject) => {
      const { player_id, coins, fruits, eggs, pets, mutations, session_duration } = gameData;
      const sql = `INSERT INTO game_data 
        (player_id, coins, fruits, eggs, pets, mutations, session_duration) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`;
      
      this.db.run(sql, [
        player_id, 
        coins, 
        JSON.stringify(fruits || {}), 
        JSON.stringify(eggs || {}), 
        JSON.stringify(pets || {}), 
        JSON.stringify(mutations || {}), 
        session_duration || 0
      ], function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve({ id: this.lastID });
      });
    });
  }

  async getLatestGameData(player_id) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM game_data WHERE player_id = ? ORDER BY timestamp DESC LIMIT 1`;
      
      this.db.get(sql, [player_id], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        if (row) {
          // Parse JSON fields
          try {
            row.fruits = JSON.parse(row.fruits || '{}');
            row.eggs = JSON.parse(row.eggs || '{}');
            row.pets = JSON.parse(row.pets || '{}');
            row.mutations = JSON.parse(row.mutations || '{}');
          } catch (e) {
            console.error('Error parsing game data JSON:', e);
          }
        }
        resolve(row);
      });
    });
  }

  async getGameDataHistory(player_id, hours = 24) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM game_data 
        WHERE player_id = ? AND timestamp > datetime('now', '-${hours} hours') 
        ORDER BY timestamp ASC`;
      
      this.db.all(sql, [player_id], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Parse JSON fields for all rows
        const parsedRows = (rows || []).map(row => {
          try {
            row.fruits = JSON.parse(row.fruits || '{}');
            row.eggs = JSON.parse(row.eggs || '{}');
            row.pets = JSON.parse(row.pets || '{}');
            row.mutations = JSON.parse(row.mutations || '{}');
          } catch (e) {
            console.error('Error parsing game data JSON:', e);
          }
          return row;
        });
        
        resolve(parsedRows);
      });
    });
  }

  // Admin operations
  async createAdmin(username, passwordHash) {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO admin_users (username, password_hash) VALUES (?, ?)`;
      
      this.db.run(sql, [username, passwordHash], function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve({ id: this.lastID });
      });
    });
  }

  async getAdmin(username) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM admin_users WHERE username = ?`;
      
      this.db.get(sql, [username], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row);
      });
    });
  }

  async updateAdminLogin(username) {
    return new Promise((resolve, reject) => {
      const sql = `UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE username = ?`;
      
      this.db.run(sql, [username], function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve(this.changes > 0);
      });
    });
  }

  // Statistics
  async getStats() {
    return new Promise((resolve, reject) => {
      const queries = [
        'SELECT COUNT(*) as total_tokens FROM tokens',
        'SELECT COUNT(*) as active_tokens FROM tokens WHERE is_banned = FALSE',
        'SELECT COUNT(*) as total_players FROM players',
        'SELECT COUNT(*) as total_data_points FROM game_data',
        'SELECT COUNT(*) as recent_syncs FROM game_data WHERE timestamp > datetime("now", "-1 hour")'
      ];

      const stats = {};
      let completed = 0;

      queries.forEach((sql, index) => {
        this.db.get(sql, (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          
          const key = Object.keys(row)[0];
          stats[key] = row[key];
          
          completed++;
          if (completed === queries.length) {
            resolve(stats);
          }
        });
      });
    });
  }

  // Close database connection
  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
        } else {
          console.log('Database connection closed');
        }
      });
    }
  }
}

module.exports = new Database();
