# 🚀 Zebux Dashboard - Deployment Guide

**The Easiest Way to Deploy Your Universal Game Tracker**

## 🎯 Quick Start (5 Minutes)

### 1. Choose Your Platform

| Platform | Cost | Difficulty | Best For |
|----------|------|------------|----------|
| **Railway** | FREE | ⭐ Easiest | Beginners |
| **Heroku** | FREE | ⭐⭐ Easy | General use |
| **DigitalOcean** | $5/month | ⭐⭐⭐ Medium | High traffic |
| **Docker** | Varies | ⭐⭐⭐⭐ Advanced | Self-hosted |

### 2. One-Click Deploy

#### Railway (Recommended)
```bash
# Just click this button:
```
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/zebux-dashboard)

#### Heroku
```bash
# Just click this button:
```
[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/zebuxhub/zebux-dashboard)

#### DigitalOcean
```bash
# Just click this button:
```
[![Deploy to DO](https://www.deploytodo.com/do-btn-blue.svg)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/zebuxhub/zebux-dashboard)

### 3. Configure Environment Variables

Set these in your deployment platform:

```env
NODE_ENV=production
ADMIN_USERNAME=user
ADMIN_PASSWORD=password
JWT_SECRET=your-random-secret-key
```

### 4. Done! 🎉

Your dashboard is now live at your deployment URL!

---

## 🔧 Detailed Setup Instructions

### Railway Deployment

1. **Create Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Deploy Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect this repository
   - Railway will auto-detect and deploy

3. **Set Environment Variables**
   ```
   NODE_ENV=production
   ADMIN_USERNAME=your-admin-username
   ADMIN_PASSWORD=your-secure-password
   JWT_SECRET=railway-zebux-$(openssl rand -hex 32)
   ```

4. **Custom Domain (Optional)**
   - Go to Settings → Domains
   - Add your custom domain
   - Update DNS records as shown

### Heroku Deployment

1. **Create Account**
   - Go to [heroku.com](https://heroku.com)
   - Sign up for free

2. **Deploy via Button**
   - Click the deploy button above
   - Fill in app name and environment variables
   - Click "Deploy app"

3. **Manual Deploy (Alternative)**
   ```bash
   # Install Heroku CLI
   npm install -g heroku
   
   # Login and create app
   heroku login
   heroku create your-app-name
   
   # Set environment variables
   heroku config:set NODE_ENV=production
   heroku config:set ADMIN_USERNAME=admin
   heroku config:set ADMIN_PASSWORD=secure-password
   heroku config:set JWT_SECRET=$(openssl rand -hex 32)
   
   # Deploy
   git push heroku main
   ```

### DigitalOcean App Platform

1. **Create Account**
   - Go to [digitalocean.com](https://digitalocean.com)
   - Get $200 free credit

2. **Create App**
   - Go to Apps → Create App
   - Connect GitHub repository
   - Select this repo

3. **Configure Build**
   - Build Command: `npm run build`
   - Run Command: `npm start`
   - HTTP Port: `3000`

4. **Set Environment Variables**
   ```
   NODE_ENV=production
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=your-password
   JWT_SECRET=do-zebux-secret-key
   ```

5. **Deploy**
   - Review and create
   - Wait for deployment (5-10 minutes)

### Docker Deployment

1. **Prerequisites**
   ```bash
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   
   # Install Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

2. **Clone and Deploy**
   ```bash
   # Clone repository
   git clone https://github.com/zebuxhub/zebux-dashboard.git
   cd zebux-dashboard
   
   # Create environment file
   cp env.example .env
   # Edit .env with your settings
   
   # Deploy with Docker Compose
   docker-compose up -d
   ```

3. **Access Dashboard**
   - Dashboard: `http://localhost:3000`
   - Admin: `http://localhost:3000/admin`

---

## 🔒 Security Configuration

### Change Default Credentials

**⚠️ IMPORTANT: Always change the default admin credentials!**

```env
# DON'T use these defaults in production:
ADMIN_USERNAME=user
ADMIN_PASSWORD=password

# Use strong credentials like:
ADMIN_USERNAME=admin
ADMIN_PASSWORD=MySecurePassword123!
```

### Generate Secure JWT Secret

```bash
# Generate a random JWT secret
openssl rand -hex 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use online generator
# https://generate-secret.vercel.app/32
```

### Environment Variables Security

1. **Never commit secrets to Git**
2. **Use platform environment variables**
3. **Rotate secrets regularly**
4. **Use different secrets per environment**

---

## 🌐 Custom Domain Setup

### Railway
1. Go to Settings → Domains
2. Add your domain
3. Update DNS:
   ```
   CNAME your-domain.com your-app.railway.app
   ```

### Heroku
1. Go to Settings → Domains
2. Add custom domain
3. Update DNS:
   ```
   CNAME your-domain.com your-app.herokuapp.com
   ```

### DigitalOcean
1. Go to Settings → Domains
2. Add domain
3. Update DNS records as shown

---

## 📊 Monitoring & Maintenance

### Health Checks

All deployments include automatic health checks:
- Endpoint: `/api/health`
- Interval: 30 seconds
- Timeout: 10 seconds

### Logs

**Railway:**
```bash
railway logs
```

**Heroku:**
```bash
heroku logs --tail -a your-app-name
```

**DigitalOcean:**
- View in Apps dashboard → Runtime Logs

**Docker:**
```bash
docker-compose logs -f
```

### Updates

**Railway/Heroku/DigitalOcean:**
- Automatic deployment on Git push
- Or redeploy from dashboard

**Docker:**
```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose up -d --build
```

---

## 🆘 Troubleshooting

### Common Issues

**1. "Application Error" on startup**
- Check environment variables are set
- Verify JWT_SECRET is configured
- Check logs for specific errors

**2. Admin login not working**
- Verify ADMIN_USERNAME and ADMIN_PASSWORD
- Try clearing browser cache
- Check if credentials were set correctly

**3. Database errors**
- SQLite database is created automatically
- Check write permissions in data directory
- Verify disk space available

**4. API requests failing**
- Check CORS settings
- Verify API URL in Lua script
- Check network connectivity

### Getting Help

1. **Check logs first** - Most issues show in logs
2. **Verify environment variables** - Common cause of issues
3. **Test locally** - Use Docker to test locally
4. **Join Discord** - [discord.gg/zebux](https://discord.gg/zebux)

---

## 🚀 Performance Optimization

### Railway
- Upgrade to Pro plan for better performance
- Enable auto-scaling
- Use Railway's CDN

### Heroku
- Upgrade to Standard dynos
- Enable auto-scaling
- Add Redis for caching

### DigitalOcean
- Upgrade to Professional plan
- Enable auto-scaling
- Use DigitalOcean Spaces for assets

### Docker
- Use production Docker image
- Add Redis container
- Configure reverse proxy (Nginx)

---

## 📈 Scaling for High Traffic

### Database Optimization
```javascript
// Add to backend/database/database.js
// Enable WAL mode for better performance
this.db.exec('PRAGMA journal_mode = WAL;');
this.db.exec('PRAGMA synchronous = NORMAL;');
this.db.exec('PRAGMA cache_size = 1000000;');
```

### Redis Caching
```yaml
# Add to docker-compose.yml
redis:
  image: redis:7-alpine
  restart: unless-stopped
  volumes:
    - redis_data:/data
```

### Load Balancing
```nginx
# nginx.conf
upstream zebux_backend {
    server app1:3000;
    server app2:3000;
    server app3:3000;
}

server {
    listen 80;
    location / {
        proxy_pass http://zebux_backend;
    }
}
```

---

## ✅ Deployment Checklist

Before going live:

- [ ] Changed default admin credentials
- [ ] Set secure JWT secret
- [ ] Configured custom domain (optional)
- [ ] Tested admin panel access
- [ ] Tested token generation
- [ ] Tested Lua script integration
- [ ] Set up monitoring/alerts
- [ ] Backed up configuration
- [ ] Documented access credentials
- [ ] Tested on mobile devices

---

**🎉 Congratulations! Your Zebux Dashboard is now live and ready to track your game data across multiple accounts with beautiful charts and real-time updates!**

*Made with ❤️ by Zebux Team*
