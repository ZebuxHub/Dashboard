const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
  constructor() {
    this.db = null;
    this.dbPath = path.join(__dirname, '../data/zebux.db');
  }

  async init() {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Initialize SQLite database
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('❌ Database connection failed:', err.message);
          throw err;
        }
        console.log('✅ Connected to SQLite database');
      });

      // Create tables
      await this.createTables();
      
      return true;
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  async createTables() {
    return new Promise((resolve, reject) => {
      const queries = [
        // Users table
        `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          display_name TEXT,
          user_id INTEGER UNIQUE,
          token TEXT UNIQUE NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_sync DATETIME,
          is_active BOOLEAN DEFAULT 1,
          is_banned BOOLEAN DEFAULT 0,
          ban_reason TEXT,
          ip_address TEXT,
          hwid TEXT,
          total_syncs INTEGER DEFAULT 0
        )`,
        
        // Player data table
        `CREATE TABLE IF NOT EXISTS player_data (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          coins INTEGER DEFAULT 0,
          gems INTEGER DEFAULT 0,
          pets INTEGER DEFAULT 0,
          eggs INTEGER DEFAULT 0,
          mutations INTEGER DEFAULT 0,
          raw_data TEXT,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )`,
        
        // Sync logs table
        `CREATE TABLE IF NOT EXISTS sync_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          status TEXT NOT NULL,
          ip_address TEXT,
          user_agent TEXT,
          error_message TEXT,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )`,
        
        // Admin logs table
        `CREATE TABLE IF NOT EXISTS admin_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          admin_username TEXT NOT NULL,
          action TEXT NOT NULL,
          target_user_id INTEGER,
          details TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          ip_address TEXT
        )`,
        
        // Settings table
        `CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
      ];

      let completed = 0;
      const total = queries.length;

      queries.forEach((query, index) => {
        this.db.run(query, (err) => {
          if (err) {
            console.error(`❌ Failed to create table ${index + 1}:`, err.message);
            reject(err);
            return;
          }
          
          completed++;
          if (completed === total) {
            console.log('✅ All database tables created successfully');
            resolve();
          }
        });
      });
    });
  }

  // User operations
  async createUser(userData) {
    return new Promise((resolve, reject) => {
      const { username, displayName, userId, token, ipAddress, hwid } = userData;
      
      const query = `
        INSERT INTO users (username, display_name, user_id, token, ip_address, hwid)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      this.db.run(query, [username, displayName, userId, token, ipAddress, hwid], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, ...userData });
        }
      });
    });
  }

  async getUserByToken(token) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM users WHERE token = ? AND is_active = 1 AND is_banned = 0';
      
      this.db.get(query, [token], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async updateUserSync(userId) {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE users 
        SET last_sync = CURRENT_TIMESTAMP, total_syncs = total_syncs + 1
        WHERE id = ?
      `;
      
      this.db.run(query, [userId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }

  // Player data operations
  async savePlayerData(userId, gameData) {
    return new Promise((resolve, reject) => {
      const { coins, gems, pets, eggs, mutations } = gameData;
      
      const query = `
        INSERT INTO player_data (user_id, coins, gems, pets, eggs, mutations, raw_data)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      this.db.run(query, [
        userId, coins || 0, gems || 0, pets || 0, eggs || 0, mutations || 0,
        JSON.stringify(gameData)
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID });
        }
      });
    });
  }

  async getPlayerHistory(userId, limit = 24) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM player_data 
        WHERE user_id = ? 
        ORDER BY timestamp DESC 
        LIMIT ?
      `;
      
      this.db.all(query, [userId, limit], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Admin operations
  async getAllUsers() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT u.*, 
               pd.coins, pd.gems, pd.pets, pd.eggs, pd.mutations,
               pd.timestamp as last_data_update
        FROM users u
        LEFT JOIN player_data pd ON u.id = pd.user_id
        WHERE pd.id = (
          SELECT id FROM player_data pd2 
          WHERE pd2.user_id = u.id 
          ORDER BY timestamp DESC 
          LIMIT 1
        )
        ORDER BY u.last_sync DESC
      `;
      
      this.db.all(query, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async getStats() {
    return new Promise((resolve, reject) => {
      const queries = {
        totalUsers: 'SELECT COUNT(*) as count FROM users WHERE is_active = 1',
        activeTokens: 'SELECT COUNT(*) as count FROM users WHERE is_active = 1 AND is_banned = 0',
        totalSyncs: 'SELECT SUM(total_syncs) as total FROM users',
        todaySyncs: `SELECT COUNT(*) as count FROM sync_logs WHERE date(timestamp) = date('now')`
      };

      const stats = {};
      let completed = 0;
      const total = Object.keys(queries).length;

      Object.entries(queries).forEach(([key, query]) => {
        this.db.get(query, [], (err, row) => {
          if (err) {
            console.error(`Stats query error for ${key}:`, err);
            stats[key] = 0;
          } else {
            stats[key] = row.count || row.total || 0;
          }
          
          completed++;
          if (completed === total) {
            resolve(stats);
          }
        });
      });
    });
  }

  // Logging
  async logSync(userId, status, ipAddress, userAgent, errorMessage = null) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO sync_logs (user_id, status, ip_address, user_agent, error_message)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      this.db.run(query, [userId, status, ipAddress, userAgent, errorMessage], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID });
        }
      });
    });
  }

  async close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('❌ Error closing database:', err.message);
        } else {
          console.log('✅ Database connection closed');
        }
      });
    }
  }
}

// Create singleton instance
const database = new Database();

module.exports = database;
