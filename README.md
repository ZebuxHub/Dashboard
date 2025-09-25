# 🚀 Zebux Dashboard - Universal Game Data Tracker

A beautiful, real-time dashboard for tracking your game progress across multiple accounts. Built with glassmorphism design and Apple-style UI.

## ✨ Features

- 🎮 **Universal Game Support** - Works with any Roblox game
- 📊 **Real-time Data Sync** - Live updates from your Lua scripts
- 📈 **Historical Charts** - Track progress over time (forever storage)
- 🔄 **Multi-Account Support** - Manage multiple game accounts
- 🎨 **Beautiful UI** - Glassmorphism design with dark/purple theme
- 📱 **Mobile Responsive** - Works on all devices
- 🔒 **Secure** - HWID/IP locked tokens
- ⚡ **High Performance** - Handles thousands of users

## 🚀 One-Click Deployment

### Option 1: Railway (Recommended)
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/zebux-dashboard)

### Option 2: DigitalOcean
[![Deploy to DO](https://www.deploytodo.com/do-btn-blue.svg)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/zebuxhub/zebux-dashboard)

### Option 3: Heroku
[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/zebuxhub/zebux-dashboard)

## 📋 Quick Setup (5 minutes)

1. **Click deploy button above**
2. **Set environment variables:**
   - `ADMIN_USERNAME=user`
   - `ADMIN_PASSWORD=password`
   - `JWT_SECRET=your-random-secret-key`
3. **Wait for deployment** (2-3 minutes)
4. **Visit your dashboard** and generate tokens!

## 🎮 Lua Integration

Add this to your Roblox script:

```lua
-- Load the sync system
local WebsiteSync = loadstring(game:HttpGet("https://your-domain.railway.app/api/lua/sync.lua"))()

-- Initialize with your token
WebsiteSync.Init({
    token = "your-generated-token-here",
    apiUrl = "https://your-domain.railway.app/api",
    syncInterval = 5 * 60, -- 5 minutes
    autoStart = true,
    debug = false
})
```

## 🔧 Admin Panel

Access your admin panel at: `https://your-domain.railway.app/admin`

- View all users and tokens
- Monitor active connections
- Ban/unban tokens
- View usage statistics
- HWID/IP tracking

## 📊 Data Tracked

- 💰 **Economy**: Coins, Net Worth
- 🍎 **Fruits**: All fruit types with counts
- 🥚 **Eggs**: All egg types with counts  
- 🐾 **Pets**: Individual/Average/Total speeds
- ✨ **Mutations**: Counts per type (Golden: 5, Diamond: 2)
- 📈 **Historical Data**: Forever storage with charts

## 🎨 Features

- **Multiple View Styles**: Cards, Tables, Widgets
- **Chart Intervals**: Minutes, Hours, Days, Weeks
- **Theme Support**: Dark/Light mode with purple accents
- **Account Management**: Custom names, Roblox username defaults
- **Multi-Device Support**: One token works on multiple devices
- **Real-time Updates**: WebSocket connections
- **Data Export**: JSON/CSV downloads
- **Notifications**: Toggle-able alerts for changes

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + Socket.IO
- **Database**: SQLite (embedded) + Redis (caching)
- **Deployment**: Docker + Railway/DigitalOcean
- **Security**: JWT tokens + HWID/IP tracking

## 📱 Mobile Support

Fully responsive design that works perfectly on:
- 📱 Mobile phones
- 📱 Tablets  
- 💻 Desktop computers
- 🖥️ Large monitors

## 🔒 Security Features

- **Token-based Authentication**: Lifetime tokens
- **HWID/IP Locking**: Prevent token sharing
- **Rate Limiting**: Prevent abuse
- **Admin Controls**: Ban/unban system
- **Secure Headers**: CORS, CSP, etc.

## 📈 Scalability

Built to handle:
- ✅ **1,000+ concurrent users**
- ✅ **10,000+ accounts**
- ✅ **Millions of data points**
- ✅ **Real-time updates**

## 🆘 Support

Need help? Join our Discord: [discord.gg/zebux](https://discord.gg/zebux)

## 📄 License

MIT License - Feel free to modify and use!

---

Made with ❤️ by Zebux Team
