const mongoose = require('mongoose');
require('dotenv').config();

// Test database setup
const TEST_DB_URI = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/lula-test';

beforeAll(async () => {
  // Connect to test database
  await mongoose.connect(TEST_DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log('✅ Connected to test database');
});

afterAll(async () => {
  // Clean up test database
  await mongoose.connection.db.dropDatabase();
  await mongoose.disconnect();
  console.log('✅ Disconnected from test database');
});

// Global test utilities
global.testUtils = {
  // Create test user
  createTestUser: async (userData = {}) => {
    const User = require('../src/models/User');
    const defaultUser = {
      phoneNumber: '+1234567890',
      role: 'USER',
      name: 'Test User',
      ...userData
    };
    return await User.create(defaultUser);
  },

  // Create test streamer
  createTestStreamer: async (streamerData = {}) => {
    const User = require('../src/models/User');
    const defaultStreamer = {
      phoneNumber: '+0987654321',
      role: 'STREAMER',
      name: 'Test Streamer',
      ...streamerData
    };
    return await User.create(defaultStreamer);
  },

  // Create test call
  createTestCall: async (callData = {}) => {
    const Call = require('../src/models/Call');
    const defaultCall = {
      callerId: new mongoose.Types.ObjectId(),
      receiverId: new mongoose.Types.ObjectId(),
      callType: 'voice',
      streamCallId: `test_call_${Date.now()}`,
      status: 'initiated',
      coinsPerMinute: 49,
      ...callData
    };
    return await Call.create(defaultCall);
  },

  // Create test coin wallet
  createTestCoinWallet: async (walletData = {}) => {
    const Coin = require('../src/models/Coin');
    const defaultWallet = {
      userId: new mongoose.Types.ObjectId(),
      balance: 1000,
      totalPurchased: 1000,
      totalSpent: 0,
      totalEarned: 0,
      ...walletData
    };
    return await Coin.create(defaultWallet);
  },

  // Create test transaction
  createTestTransaction: async (transactionData = {}) => {
    const Transaction = require('../src/models/Transaction');
    const defaultTransaction = {
      userId: new mongoose.Types.ObjectId(),
      type: 'purchase',
      amount: 100,
      balanceBefore: 0,
      balanceAfter: 100,
      description: 'Test transaction',
      status: 'completed',
      ...transactionData
    };
    return await Transaction.create(defaultTransaction);
  },

  // Clean up test data
  cleanupTestData: async () => {
    const User = require('../src/models/User');
    const Call = require('../src/models/Call');
    const Coin = require('../src/models/Coin');
    const Transaction = require('../models/Transaction');

    await Promise.all([
      User.deleteMany({}),
      Call.deleteMany({}),
      Coin.deleteMany({}),
      Transaction.deleteMany({})
    ]);
  }
};
