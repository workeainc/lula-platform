# 🚀 Lula Backend - Production Deployment Guide

This guide covers the complete deployment process for the Lula Backend from Firebase to Express.js + MongoDB.

## 📋 Prerequisites

- Ubuntu 20.04+ or CentOS 8+
- Node.js 18+
- MongoDB 6.0+
- PM2 or Docker
- Nginx (for reverse proxy)
- SSL certificates
- AWS S3 access
- Firebase Admin SDK credentials

## 🛠️ Installation Methods

### Method 1: PM2 Deployment (Recommended)

```bash
# Clone repository
git clone <repository-url>
cd lula-backend

# Install dependencies
npm install

# Configure environment
cp env.production.example .env.production
# Edit .env.production with your values

# Run deployment script
chmod +x deploy.sh
./deploy.sh deploy
```

### Method 2: Docker Deployment

```bash
# Clone repository
cd lula-backend

# Configure environment
cp env.production.example .env.production
# Edit .env.production with your values

# Start services
docker-compose up -d --build
```

## 🔧 Configuration

### Environment Variables

Copy `env.production.example` to `.env.production` and update:

```bash
# Database
MONGODB_URI=mongodb://username:password@localhost:27017/lula

# JWT
JWT_SECRET=your-super-secret-jwt-key

# AWS S3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=your-bucket-name

# Stream.io
STREAM_API_KEY=your-stream-key
STREAM_API_SECRET=your-stream-secret

# Firebase (for migration)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_KEY=path-to-key.json
```

### SSL Setup

1. **Using Let's Encrypt:**
```bash
sudo apt install certbot
sudo certbot certonly --standalone -d yourdomain.com
```

2. **Manual SSL:**
   - Place certificates in `ssl/cert.pem` and `ssl/key.pem`
   - Update Nginx configuration

## 📊 Database Migration

### Firebase to MongoDB Migration

1. **Prepare Firebase credentials:**
```bash
# Download service account key from Firebase Console
# Place it in the project root as firebase-service-account.json
```

2. **Run migration:**
```bash
# Install Firebase Admin SDK
npm install firebase-admin

# Run complete migration
npm run migrate
```

3. **Verify migration:**
```bash
# Check data integrity
node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI);
const User = require('./src/models/User');
User.countDocuments().then(count => console.log('Users migrated:', count));
"
```

## 🔄 Real-time Features

### WebSocket Configuration

The backend includes real-time billing system:

- **Per-minute coin deduction** during calls
- **Live balance updates** via Socket.io
- **Commission tracking** in real-time
- **Call monitoring** and analytics

### Testing Real-time Features

```bash
# Test WebSocket connection
node -e "
const io = require('socket.io-client');
const socket = io('http://localhost:5000');
socket.on('connect', () => console.log('Connected to WebSocket'));
"
```

## 🛡️ Security Configuration

### Nginx Security Headers

```nginx
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

### Rate Limiting

- **API routes:** 10 requests/second
- **Auth routes:** 5 requests/second
- **Burst allowance:** 20 requests

### CORS Configuration

```javascript
// Configure allowed origins
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

## 📈 Monitoring & Logging

### PM2 Monitoring

```bash
# View PM2 status
pm2 status

# View logs
pm2 logs lula-backend

# Monitor resources
pm2 monit
```

### Docker Monitoring

```bash
# View container status
docker ps

# View logs
docker-compose logs -f backend

# Monitor resources
docker stats
```

### Health Checks

```bash
# API health check
curl http://localhost:5000/api/health

# Database health
curl http://localhost:5000/api/health | jq .database

# WebSocket health
curl http://localhost:5000/api/health | jq .websocket
```

## 🔧 Maintenance

### Backup Strategy

```bash
# Create backup
./deploy.sh backup

# Automated backups (crontab)
0 2 * * * /path/to/lula-backend/deploy.sh backup
```

### Updates

```bash
# Update application
git pull origin main
npm install
pm2 restart lula-backend

# Or with Docker
docker-compose down
docker-compose up -d --build
```

### Rollback

```bash
# Rollback to previous version
./deploy.sh rollback
```

## 🧪 Testing

### Unit Tests

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage
```

### Integration Tests

```bash
# Run integration tests
npm run test:integration
```

### Load Testing

```bash
# Install artillery
npm install -g artillery

# Run load test
artillery quick --count 100 --num 10 http://localhost:5000/api/health
```

## 📱 Mobile App Integration

### API Endpoints

- **Authentication:** `/api/auth/*`
- **Users:** `/api/user/*`
- **Calls:** `/api/call/*`
- **Coins:** `/api/coin/*`
- **Admin:** `/api/admin/*`

### WebSocket Events

- `billing:started` - Real-time billing started
- `coins:deducted` - Coins deducted from user
- `commission:earned` - Commission earned by streamer
- `call:ended` - Call ended

### Example Integration

```javascript
// Connect to WebSocket
const socket = io('https://your-api-domain.com');

// Listen for billing events
socket.on('coins:deducted', (data) => {
  console.log('Coins deducted:', data.amount);
  updateUserBalance(data.newBalance);
});

socket.on('commission:earned', (data) => {
  console.log('Commission earned:', data.amount);
  updateStreamerEarnings(data.newEarnings);
});
```

## 🚨 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed:**
```bash
# Check MongoDB status
sudo systemctl status mongod

# Check connection string
echo $MONGODB_URI
```

2. **WebSocket Not Connecting:**
```bash
# Check Socket.io configuration
grep -r "socketIo" src/

# Check CORS settings
grep -r "cors" src/
```

3. **Real-time Billing Not Working:**
```bash
# Check billing service
pm2 logs lula-backend | grep billing

# Check call status
curl -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/call/billing/$CALL_ID
```

### Log Analysis

```bash
# View application logs
tail -f logs/combined.log

# Filter error logs
grep "ERROR" logs/error.log

# Monitor real-time logs
pm2 logs lula-backend --lines 100
```

## 📞 Support

For deployment issues:

1. Check logs: `pm2 logs lula-backend`
2. Verify configuration: `./deploy.sh monitor`
3. Test API: `curl http://localhost:5000/api/health`
4. Check database: MongoDB connection
5. Verify WebSocket: Socket.io connection

## 🎯 Performance Optimization

### Database Optimization

```javascript
// Add indexes for better performance
db.users.createIndex({ phoneNumber: 1 })
db.calls.createIndex({ callerId: 1, receiverId: 1 })
db.transactions.createIndex({ userId: 1, createdAt: -1 })
```

### Caching Strategy

```bash
# Install Redis for caching
sudo apt install redis-server

# Configure Redis in environment
REDIS_URL=redis://localhost:6379
```

### Load Balancing

```nginx
# Multiple backend instances
upstream backend {
    server backend1:5000;
    server backend2:5000;
    server backend3:5000;
}
```

---

## ✅ Deployment Checklist

- [ ] Environment variables configured
- [ ] MongoDB running and accessible
- [ ] SSL certificates installed
- [ ] Firebase migration completed
- [ ] Real-time billing tested
- [ ] Admin panel accessible
- [ ] Mobile app integration tested
- [ ] Monitoring setup complete
- [ ] Backup strategy implemented
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Health checks working
- [ ] Performance optimized

**🎉 Your Lula Backend is now ready for production!**
