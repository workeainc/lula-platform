# 🗄️ MongoDB Setup Guide

## 📋 **MongoDB Installation Options**

### **Option 1: Docker (Recommended)**
```bash
# Start MongoDB with Docker
docker run -d \
  --name lula-mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password123 \
  -e MONGO_INITDB_DATABASE=lula \
  -v lula-mongo-data:/data/db \
  mongo:6

# Or use docker-compose
docker-compose up mongo -d
```

### **Option 2: Local Installation**
1. **Download MongoDB Community Server** from [mongodb.com](https://www.mongodb.com/try/download/community)
2. **Install MongoDB** following the installation guide
3. **Start MongoDB service**:
   ```bash
   # Windows
   net start MongoDB
   
   # macOS/Linux
   sudo systemctl start mongod
   ```

### **Option 3: MongoDB Atlas (Cloud)**
1. **Create account** at [cloud.mongodb.com](https://cloud.mongodb.com)
2. **Create cluster** (free tier available)
3. **Get connection string** and update your `.env` file

---

## 🔧 **Configuration**

### **Environment Variables**
Update your `apps/backend/.env` file:
```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/lula
# OR for Docker with auth:
MONGODB_URI=mongodb://admin:password123@localhost:27017/lula?authSource=admin

# OR for MongoDB Atlas:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lula
```

### **Connection Options**
```env
# Local MongoDB (no auth)
MONGODB_URI=mongodb://localhost:27017/lula

# Local MongoDB (with auth)
MONGODB_URI=mongodb://admin:password123@localhost:27017/lula?authSource=admin

# MongoDB Atlas (cloud)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lula?retryWrites=true&w=majority
```

---

## 🚀 **Quick Start with Docker**

### **1. Start MongoDB**
```bash
# From monorepo root
docker-compose up mongo -d
```

### **2. Verify Connection**
```bash
# Check if MongoDB is running
docker ps | grep mongo

# Connect to MongoDB
docker exec -it lula-mongodb mongosh
```

### **3. Initialize Database**
```bash
# The mongo-init.js script will run automatically
# Or run manually:
docker exec -it lula-mongodb mongosh -u admin -p password123 --authenticationDatabase admin
```

---

## 📊 **Database Structure**

### **Collections**
- **users** - User accounts and profiles
- **calls** - Call history and records
- **chats** - Chat rooms and messages
- **transactions** - Payment and coin transactions
- **notifications** - Push notifications
- **withdrawals** - Withdrawal requests

### **Indexes**
```javascript
// Users collection
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "phone": 1 }, { unique: true })

// Calls collection
db.calls.createIndex({ "callerId": 1, "receiverId": 1 })
db.calls.createIndex({ "status": 1, "createdAt": -1 })

// Messages collection
db.messages.createIndex({ "chatId": 1, "timestamp": -1 })
```

---

## 🔍 **Testing Connection**

### **1. Test Backend Connection**
```bash
# Start backend
cd apps/backend
npm start

# Check logs for MongoDB connection
# Should see: "Connected to MongoDB"
```

### **2. Test with MongoDB Compass**
1. **Download** [MongoDB Compass](https://www.mongodb.com/products/compass)
2. **Connect** using: `mongodb://localhost:27017/lula`
3. **Browse** your database and collections

### **3. Test with mongosh**
```bash
# Connect to MongoDB
mongosh mongodb://localhost:27017/lula

# List databases
show dbs

# Use lula database
use lula

# List collections
show collections

# Count documents
db.users.countDocuments()
```

---

## 🛠️ **Troubleshooting**

### **Common Issues**

#### **1. Connection Refused**
```bash
# Check if MongoDB is running
docker ps | grep mongo
# OR
netstat -an | grep 27017

# Start MongoDB
docker-compose up mongo -d
```

#### **2. Authentication Failed**
```bash
# Check credentials in .env file
# Ensure MONGODB_URI includes correct username/password
```

#### **3. Port Already in Use**
```bash
# Find process using port 27017
netstat -ano | findstr :27017

# Kill process or change port
```

#### **4. Docker Volume Issues**
```bash
# Remove old volume
docker volume rm lula-mongo-data

# Recreate with fresh data
docker-compose up mongo -d
```

---

## 📈 **Production Setup**

### **1. Security**
```env
# Use strong passwords
MONGO_INITDB_ROOT_PASSWORD=your-strong-password-here

# Enable SSL/TLS
MONGODB_URI=mongodb://admin:password@localhost:27017/lula?ssl=true
```

### **2. Backup**
```bash
# Create backup
docker exec lula-mongodb mongodump --out /backup

# Restore backup
docker exec lula-mongodb mongorestore /backup
```

### **3. Monitoring**
```bash
# Check MongoDB logs
docker logs lula-mongodb

# Monitor performance
docker exec lula-mongodb mongosh --eval "db.serverStatus()"
```

---

## ✅ **Verification**

### **Check if everything is working:**
1. **MongoDB is running** ✅
2. **Backend connects to MongoDB** ✅
3. **Database collections exist** ✅
4. **Can create/read documents** ✅

### **Test Commands:**
```bash
# 1. Start MongoDB
docker-compose up mongo -d

# 2. Start Backend
cd apps/backend
npm start

# 3. Check connection in logs
# Should see: "Connected to MongoDB successfully"

# 4. Test API endpoint
curl http://localhost:3002/api/health
```

---

## 🎯 **Next Steps**

1. **Start MongoDB** using one of the methods above
2. **Update .env files** with correct MongoDB URI
3. **Start backend** and verify connection
4. **Test API endpoints** to ensure database operations work
5. **Set up monitoring** for production use

**Your MongoDB is now ready for the Lula monorepo! 🚀**
