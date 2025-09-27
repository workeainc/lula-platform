const mongoose = require('mongoose');
const User = require('./src/models/User');
const Call = require('./src/models/Call');
const Transaction = require('./src/models/Transaction');
const Message = require('./src/models/Message');
const Chat = require('./src/models/Chat');
require('dotenv').config();

async function addAdminIndexes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lula');
    console.log('✅ Connected to MongoDB');

    // Add indexes for better admin performance
    console.log('📊 Adding database indexes for admin performance...');

    // User indexes
    await User.collection.createIndex({ role: 1, createdAt: -1 });
    await User.collection.createIndex({ isActive: 1, role: 1 });
    await User.collection.createIndex({ isVerified: 1, role: 1 });
    await User.collection.createIndex({ name: 'text', phoneNumber: 'text' }); // Text search
    console.log('✅ User indexes added');

    // Call indexes
    await Call.collection.createIndex({ status: 1, createdAt: -1 });
    await Call.collection.createIndex({ callType: 1, createdAt: -1 });
    await Call.collection.createIndex({ callerId: 1, createdAt: -1 });
    await Call.collection.createIndex({ receiverId: 1, createdAt: -1 });
    await Call.collection.createIndex({ startTime: -1, endTime: -1 });
    console.log('✅ Call indexes added');

    // Transaction indexes
    await Transaction.collection.createIndex({ type: 1, createdAt: -1 });
    await Transaction.collection.createIndex({ status: 1, createdAt: -1 });
    await Transaction.collection.createIndex({ userId: 1, createdAt: -1 });
    await Transaction.collection.createIndex({ amount: -1, createdAt: -1 });
    await Transaction.collection.createIndex({ paymentMethod: 1, createdAt: -1 });
    console.log('✅ Transaction indexes added');

    // Message indexes
    await Message.collection.createIndex({ chatId: 1, createdAt: -1 });
    await Message.collection.createIndex({ senderId: 1, createdAt: -1 });
    await Message.collection.createIndex({ 'flags.isDeleted': 1, createdAt: -1 });
    await Message.collection.createIndex({ status: 1, createdAt: -1 });
    console.log('✅ Message indexes added');

    // Chat indexes
    await Chat.collection.createIndex({ participants: 1, createdAt: -1 });
    await Chat.collection.createIndex({ 'participants.userId': 1, createdAt: -1 });
    await Chat.collection.createIndex({ 'participants.role': 1, createdAt: -1 });
    await Chat.collection.createIndex({ lastMessageAt: -1 });
    console.log('✅ Chat indexes added');

    console.log('🎉 All admin indexes added successfully!');
    console.log('📈 Admin queries should now be much faster');

  } catch (error) {
    console.error('❌ Error adding indexes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the function
addAdminIndexes();
