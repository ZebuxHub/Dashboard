# 🚀 Zebux Dashboard - Super Easy Setup Guide

**For Complete Beginners** - No coding experience needed! Just follow these steps and you'll have your own dashboard running in 5 minutes.

## 🎯 Choose Your Deployment Method

### Option 1: Railway (Recommended - FREE & EASIEST)
**Perfect for beginners, handles everything automatically**

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub (free)

2. **Deploy with One Click**
   - Click this button: [![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/zebux-dashboard)
   - Or go to Railway → New Project → Deploy from GitHub → Use this repo

3. **Set Environment Variables**
   ```
   ADMIN_USERNAME=user
   ADMIN_PASSWORD=password
   NODE_ENV=production
   ```

4. **Done!** 🎉
   - Your dashboard will be live at: `https://your-app-name.railway.app`
   - Admin panel: `https://your-app-name.railway.app/admin`

---

### Option 2: Heroku (Also Easy & FREE)
**Good alternative with simple setup**

1. **Create Heroku Account**
   - Go to [heroku.com](https://heroku.com)
   - Sign up (free)

2. **Deploy with One Click**
   - Click: [![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/zebuxhub/zebux-dashboard)

3. **Fill in the form:**
   - App name: `your-dashboard-name`
   - Admin Username: `user`
   - Admin Password: `password`
   - Click "Deploy app"

4. **Done!** 🎉
   - Your dashboard: `https://your-dashboard-name.herokuapp.com`

---

### Option 3: DigitalOcean (More Power - $5/month)
**Best for high traffic, more reliable**

1. **Create DigitalOcean Account**
   - Go to [digitalocean.com](https://digitalocean.com)
   - Sign up (get $200 free credit)

2. **Deploy App Platform**
   - Click: [![Deploy to DO](https://www.deploytodo.com/do-btn-blue.svg)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/zebuxhub/zebux-dashboard)

3. **Configure:**
   - Choose: Basic ($5/month)
   - Set environment variables:
     ```
     ADMIN_USERNAME=user
     ADMIN_PASSWORD=password
     NODE_ENV=production
     ```

4. **Deploy & Done!** 🎉

---

### Option 4: Docker (For Advanced Users)
**If you have your own server**

1. **Install Docker**
   ```bash
   # On Ubuntu/Debian
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   ```

2. **Run with Docker Compose**
   ```bash
   git clone https://github.com/zebuxhub/zebux-dashboard.git
   cd zebux-dashboard
   docker-compose up -d
   ```

3. **Access Dashboard**
   - Dashboard: `http://localhost:3000`
   - Admin: `http://localhost:3000/admin`

---

## 🎮 Add to Your Roblox Script

Once your dashboard is deployed:

1. **Get Your URL**
   - Railway: `https://your-app.railway.app`
   - Heroku: `https://your-app.herokuapp.com`
   - DigitalOcean: `https://your-app.ondigitalocean.app`

2. **Generate Token**
   - Go to: `https://your-url.com/token`
   - Click "Generate Token"
   - Copy the token

3. **Add to Your Lua Script**
   ```lua
   -- Add this to the TOP of your Roblox script
   local WebsiteSync = loadstring(game:HttpGet("https://your-url.com/api/lua/sync.lua"))()
   
   -- Initialize with your token
   WebsiteSync.Init({
       token = "your-token-here",
       apiUrl = "https://your-url.com/api",
       syncInterval = 5 * 60, -- 5 minutes
       autoStart = true
   })
   ```

4. **Done!** Your game data will sync automatically! 🎉

---

## 🔧 Admin Panel Access

- **URL**: `https://your-url.com/admin`
- **Username**: `user` (or what you set)
- **Password**: `password` (or what you set)

### Admin Features:
- 👥 View all users and tokens
- 📊 Monitor usage statistics
- 🚫 Ban/unban tokens
- 📈 Analytics dashboard
- 🔒 HWID/IP tracking

---

## 🎨 Dashboard Features

### 📊 **Data Tracking**
- 💰 Coins & Net Worth
- 🍎 Fruits (all types with counts)
- 🥚 Eggs (all types with counts)
- 🐾 Pets (individual/average/total speeds)
- ✨ Mutations (counts per type)
- 📈 Historical charts (forever storage)

### 🎮 **Multi-Account Support**
- Switch between accounts with dropdown
- Custom account names
- Overview of all accounts
- Individual account details

### 📱 **Beautiful UI**
- Glassmorphism design
- Dark/Light theme toggle
- Mobile responsive
- Apple-style interface
- Real-time updates

---

## 🆘 Troubleshooting

### **Dashboard not loading?**
- Check if your deployment is still running
- Verify the URL is correct
- Try refreshing the page

### **Token not working?**
- Make sure you copied the full token
- Check the API URL is correct
- Verify your script has internet access

### **Data not syncing?**
- Check your Roblox script is running
- Verify the token is valid
- Make sure the game allows HTTP requests

### **Admin panel not accessible?**
- Check username/password are correct
- Try clearing browser cache
- Verify admin credentials in deployment settings

---

## 💡 Tips for Success

1. **Keep Your Token Safe**
   - Don't share your token with others
   - Each token is locked to your devices
   - Generate new tokens if compromised

2. **Customize Account Names**
   - Use meaningful names like "Main Account", "Alt 1"
   - Makes it easier to track multiple accounts

3. **Monitor Usage**
   - Check admin panel regularly
   - Monitor sync frequency
   - Watch for unusual activity

4. **Backup Important Data**
   - Export data regularly (JSON/CSV)
   - Keep tokens in safe place
   - Document your setup

---

## 🎉 You're All Set!

Your Zebux Dashboard is now ready to track all your game progress across multiple accounts with beautiful charts and real-time updates!

**Need Help?** Join our Discord: [discord.gg/zebux](https://discord.gg/zebux)

---

*Made with ❤️ by Zebux Team*
