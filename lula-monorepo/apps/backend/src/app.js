const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const callRoutes = require('./routes/call');
const coinRoutes = require('./routes/coin');
const commissionRoutes = require('./routes/commission');
const uploadRoutes = require('./routes/upload');
const adminRoutes = require('./routes/admin');
const streamRoutes = require('./routes/stream');
const chatRoutes = require('./routes/chat');
const notificationRoutes = require('./routes/notifications');
const withdrawalRoutes = require('./routes/withdrawals');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const authMiddleware = require('./middleware/auth');

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = socketIo(server, {
  cors: {
    origin: true,
    methods: ["GET", "POST"]
  }
});

// Initialize services
callRoutes.initializeBillingService(io);
chatRoutes.initializeChatService(io);
notificationRoutes.initializeNotificationService(io);

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lula', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', authMiddleware, userRoutes);
app.use('/api/call', authMiddleware, callRoutes);
app.use('/api/coin', authMiddleware, coinRoutes);
app.use('/api/commission', authMiddleware, commissionRoutes);
app.use('/api/upload', authMiddleware, uploadRoutes);
app.use('/api/admin', authMiddleware, adminRoutes);
app.use('/api/stream', streamRoutes);
app.use('/api/chat', authMiddleware, chatRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes);
app.use('/api/admin/withdrawals', authMiddleware, withdrawalRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Lula Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);
  
  // Join user to their room
  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`👤 User ${userId} joined room`);
  });
  
  // Handle call events
  socket.on('call-initiated', (data) => {
    const { callerId, receiverId, callType } = data;
    socket.to(`user-${receiverId}`).emit('incoming-call', {
      callerId,
      callType,
      timestamp: new Date().toISOString()
    });
  });
  
  // Handle call acceptance
  socket.on('call-accepted', (data) => {
    const { callerId, receiverId, callId } = data;
    socket.to(`user-${callerId}`).emit('call-accepted', {
      receiverId,
      callId,
      timestamp: new Date().toISOString()
    });
  });
  
  // Handle call rejection
  socket.on('call-rejected', (data) => {
    const { callerId, reason } = data;
    socket.to(`user-${callerId}`).emit('call-rejected', {
      reason,
      timestamp: new Date().toISOString()
    });
  });
  
  // Handle call end
  socket.on('call-ended', (data) => {
    const { callerId, receiverId, duration, coinsDeducted, commissionEarned } = data;
    
    // Notify both users about call end
    socket.to(`user-${callerId}`).emit('call-ended', {
      duration,
      coinsDeducted,
      timestamp: new Date().toISOString()
    });
    
    socket.to(`user-${receiverId}`).emit('call-ended', {
      duration,
      commissionEarned,
      timestamp: new Date().toISOString()
    });
  });
  
  // Handle balance updates
  socket.on('balance-updated', (data) => {
    const { userId, newBalance } = data;
    socket.to(`user-${userId}`).emit('balance-updated', {
      newBalance,
      timestamp: new Date().toISOString()
    });
  });
  
  // Handle commission updates
  socket.on('commission-updated', (data) => {
    const { streamerId, newCommission } = data;
    socket.to(`user-${streamerId}`).emit('commission-updated', {
      newCommission,
      timestamp: new Date().toISOString()
    });
  });

  // ==================== CHAT WEBSOCKET HANDLERS ====================
  
  // Join chat room
  socket.on('join-chat', (data) => {
    const { chatId, userId } = data;
    socket.join(`chat-${chatId}`);
    socket.join(`user-${userId}`);
    console.log(`💬 User ${userId} joined chat ${chatId}`);
  });

  // Leave chat room
  socket.on('leave-chat', (data) => {
    const { chatId, userId } = data;
    socket.leave(`chat-${chatId}`);
    console.log(`💬 User ${userId} left chat ${chatId}`);
  });

  // Handle typing indicators
  socket.on('typing-start', (data) => {
    const { chatId, userId, userName } = data;
    socket.to(`chat-${chatId}`).emit('user-typing', {
      userId,
      userName,
      isTyping: true,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('typing-stop', (data) => {
    const { chatId, userId } = data;
    socket.to(`chat-${chatId}`).emit('user-typing', {
      userId,
      isTyping: false,
      timestamp: new Date().toISOString()
    });
  });

  // Handle message read receipts
  socket.on('message-read', (data) => {
    const { chatId, messageId, userId } = data;
    socket.to(`chat-${chatId}`).emit('message-read-receipt', {
      messageId,
      userId,
      readAt: new Date().toISOString()
    });
  });

  // Handle online status
  socket.on('user-online', (data) => {
    const { userId } = data;
    socket.broadcast.emit('user-status', {
      userId,
      isOnline: true,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('user-offline', (data) => {
    const { userId } = data;
    socket.broadcast.emit('user-status', {
      userId,
      isOnline: false,
      timestamp: new Date().toISOString()
    });
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 User disconnected:', socket.id);
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: true,
    message: 'Route not found',
    path: req.originalUrl
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Lula Backend Server running on port ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = { app, io };
