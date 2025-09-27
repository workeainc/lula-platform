const admin = require('firebase-admin');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import MongoDB models
const User = require('../models/User');
const Call = require('../models/Call');
const Transaction = require('../models/Transaction');
const Coin = require('../models/Coin');

class FirebaseToMongoDBMigrator {
  constructor() {
    this.initializeFirebase();
    this.initializeMongoDB();
    this.migrationStats = {
      users: { total: 0, migrated: 0, errors: 0 },
      calls: { total: 0, migrated: 0, errors: 0 },
      transactions: { total: 0, migrated: 0, errors: 0 },
      files: { total: 0, migrated: 0, errors: 0 }
    };
    this.userIdMapping = new Map(); // Firebase ID -> MongoDB ObjectId mapping
  }

  initializeFirebase() {
    try {
      // Initialize Firebase Admin SDK
      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      
      if (!serviceAccountPath || !fs.existsSync(serviceAccountPath)) {
        throw new Error('Firebase service account key file not found');
      }

      const serviceAccount = require('../../firebase-service-account.json');
      
      try {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`
        });
      } catch (error) {
        if (error.code === 'app/duplicate-app') {
          // App already initialized, get existing app
          admin.app();
        } else {
          throw error;
        }
      }

      this.db = admin.firestore();
      this.storage = admin.storage();
      console.log('✅ Firebase Admin SDK initialized');
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error.message);
      throw error;
    }
  }

  initializeMongoDB() {
    try {
      mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lula', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('✅ MongoDB connected');
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      throw error;
    }
  }

  // Transform Firebase user data to MongoDB schema
  transformUserData(firebaseUser) {
    // Handle date fields safely
    const safeDate = (dateValue) => {
      if (!dateValue) return new Date();
      const date = new Date(dateValue);
      return isNaN(date.getTime()) ? new Date() : date;
    };

    // Extract phone number from various possible fields
    const phoneNumber = firebaseUser.phoneNumber || 
                       firebaseUser.phone || 
                       firebaseUser.phoneNumber || 
                       firebaseUser.uid || 
                       `user_${firebaseUser.id || Date.now()}`;

    return {
      phoneNumber: phoneNumber,
      role: firebaseUser.role || 'USER',
      name: firebaseUser.name || firebaseUser.displayName || firebaseUser.username || 'User',
      age: firebaseUser.age || null,
      gender: firebaseUser.gender || null,
      bio: firebaseUser.bio || firebaseUser.description || '',
      profileImage: firebaseUser.profileImage || firebaseUser.photoURL || firebaseUser.profilePicture || null,
      profileVideo: firebaseUser.profileVideo || null,
      images: firebaseUser.images || [],
      videos: firebaseUser.videos || [],
      location: firebaseUser.location || null,
      followers: firebaseUser.followers || [],
      following: firebaseUser.following || [],
      isOnline: firebaseUser.isOnline || false,
      statusShow: firebaseUser.statusShow || 'online',
      isDeleted: firebaseUser.isDeleted || false,
      isVerified: firebaseUser.isVerified || false,
      lastLoginAt: safeDate(firebaseUser.lastLoginAt),
      createdAt: safeDate(firebaseUser.createdAt),
      updatedAt: safeDate(firebaseUser.updatedAt)
    };
  }

  // Get or create MongoDB ObjectId for Firebase user ID
  async getOrCreateUserId(firebaseUserId) {
    if (this.userIdMapping.has(firebaseUserId)) {
      return this.userIdMapping.get(firebaseUserId);
    }

    // Try to find existing user by phone number
    let user = await User.findOne({ phoneNumber: firebaseUserId });
    
    if (!user) {
      // Try to find by placeholder pattern
      user = await User.findOne({ phoneNumber: `placeholder_${firebaseUserId}` });
      
      if (!user) {
        // Create placeholder user for missing Firebase user
        try {
          user = new User({
            phoneNumber: `placeholder_${firebaseUserId}`,
            role: 'USER',
            name: `Migrated User ${firebaseUserId}`,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          await user.save();
        } catch (error) {
          if (error.code === 11000) {
            // Duplicate key error - user already exists, find it
            user = await User.findOne({ phoneNumber: `placeholder_${firebaseUserId}` });
          } else {
            throw error;
          }
        }
      }
    }

    this.userIdMapping.set(firebaseUserId, user._id);
    return user._id;
  }

  // Transform Firebase call data to MongoDB schema
  async transformCallData(firebaseCall) {
    const safeDate = (dateValue) => {
      if (!dateValue) return new Date();
      const date = new Date(dateValue);
      return isNaN(date.getTime()) ? new Date() : date;
    };

    // Map Firebase status to MongoDB status
    const statusMapping = {
      'ongoing': 'ongoing',
      'completed': 'ended',
      'ended_unexpectedly': 'ended',
      'cancelled': 'declined',
      'user_ended': 'ended',
      'missed': 'missed',
      'declined': 'declined',
      'initiated': 'initiated',
      'ringing': 'ringing',
      'accepted': 'accepted'
    };

    return {
      callerId: await this.getOrCreateUserId(firebaseCall.callerId),
      receiverId: await this.getOrCreateUserId(firebaseCall.receiverId),
      callType: firebaseCall.callType || 'voice',
      streamCallId: firebaseCall.streamCallId || firebaseCall.callId || `migrated_${Date.now()}`,
      status: statusMapping[firebaseCall.status] || 'ended',
      startTime: safeDate(firebaseCall.startTime),
      endTime: firebaseCall.endTime ? safeDate(firebaseCall.endTime) : null,
      duration: firebaseCall.duration || 0,
      coinsPerMinute: firebaseCall.coinsPerMinute || 49,
      totalCoinsDeducted: firebaseCall.totalCoinsDeducted || 0,
      commissionEarned: firebaseCall.commissionEarned || 0,
      isActive: false,
      lastMinuteBilled: firebaseCall.lastMinuteBilled || 0,
      quality: firebaseCall.quality || null,
      endReason: firebaseCall.endReason || 'normal'
    };
  }

  // Transform Firebase transaction data to MongoDB schema
  async transformTransactionData(firebaseTransaction) {
    const safeDate = (dateValue) => {
      if (!dateValue) return new Date();
      const date = new Date(dateValue);
      return isNaN(date.getTime()) ? new Date() : date;
    };

    // Map Firebase transaction types to MongoDB types
    const typeMapping = {
      'earn': 'commission',
      'usage': 'deduction',
      'purchase': 'purchase',
      'withdrawal': 'withdrawal'
    };

    // Map payment methods
    const paymentMethodMapping = {
      'Razorpay': 'razorpay',
      'razorpay': 'razorpay',
      'card': 'card',
      'upi': 'upi',
      'wallet': 'wallet',
      'bank_transfer': 'bank_transfer'
    };

    return {
      userId: await this.getOrCreateUserId(firebaseTransaction.userId),
      type: typeMapping[firebaseTransaction.type] || firebaseTransaction.type || 'purchase',
      amount: firebaseTransaction.amount || firebaseTransaction.coins || 0,
      balanceBefore: firebaseTransaction.balanceBefore || 0,
      balanceAfter: firebaseTransaction.balanceAfter || 0,
      description: firebaseTransaction.description || `Migrated ${firebaseTransaction.type} transaction`,
      callId: firebaseTransaction.callId || null,
      callDuration: firebaseTransaction.callDuration || null,
      streamerId: firebaseTransaction.streamerId || null,
      commissionRate: firebaseTransaction.commissionRate || null,
      paymentMethod: paymentMethodMapping[firebaseTransaction.paymentMethod] || firebaseTransaction.paymentMethod || null,
      paymentId: firebaseTransaction.paymentId || null,
      status: firebaseTransaction.status || 'completed'
    };
  }

  // Migrate users from Firebase to MongoDB
  async migrateUsers() {
    console.log('🔄 Starting user migration...');
    
    try {
      const usersSnapshot = await this.db.collection('users').get();
      this.migrationStats.users.total = usersSnapshot.size;
      
      const batch = [];
      let batchCount = 0;
      const BATCH_SIZE = 100;

      for (const doc of usersSnapshot.docs) {
        try {
          const firebaseUser = { id: doc.id, ...doc.data() };
          const mongoUser = this.transformUserData(firebaseUser);
          
          // Check if user already exists
          const existingUser = await User.findOne({ phoneNumber: mongoUser.phoneNumber });
          if (existingUser) {
            console.log(`⚠️ User ${mongoUser.phoneNumber} already exists, skipping...`);
            continue;
          }

          const user = new User(mongoUser);
          user.firebaseId = firebaseUser.id; // Store Firebase ID for mapping
          batch.push(user);
          batchCount++;

          if (batchCount >= BATCH_SIZE) {
            const savedUsers = await User.insertMany(batch);
            // Store Firebase ID to MongoDB ObjectId mapping
            savedUsers.forEach((savedUser, index) => {
              const originalUser = batch[index];
              this.userIdMapping.set(originalUser.firebaseId, savedUser._id);
            });
            this.migrationStats.users.migrated += batch.length;
            console.log(`✅ Migrated ${batch.length} users`);
            batch.length = 0;
            batchCount = 0;
          }
        } catch (error) {
          console.error(`❌ Error migrating user ${doc.id}:`, error.message);
          this.migrationStats.users.errors++;
        }
      }

      // Insert remaining users
      if (batch.length > 0) {
        const savedUsers = await User.insertMany(batch);
        // Store Firebase ID to MongoDB ObjectId mapping
        savedUsers.forEach((savedUser, index) => {
          const originalUser = batch[index];
          this.userIdMapping.set(originalUser.firebaseId, savedUser._id);
        });
        this.migrationStats.users.migrated += batch.length;
        console.log(`✅ Migrated final ${batch.length} users`);
      }

      console.log(`✅ User migration completed: ${this.migrationStats.users.migrated}/${this.migrationStats.users.total}`);
    } catch (error) {
      console.error('❌ User migration failed:', error.message);
      throw error;
    }
  }

  // Migrate calls from Firebase to MongoDB
  async migrateCalls() {
    console.log('🔄 Starting call migration...');
    
    try {
      const callsSnapshot = await this.db.collection('callLogs').get();
      this.migrationStats.calls.total = callsSnapshot.size;
      
      const batch = [];
      let batchCount = 0;
      const BATCH_SIZE = 100;

      for (const doc of callsSnapshot.docs) {
        try {
          const firebaseCall = { id: doc.id, ...doc.data() };
          const mongoCall = await this.transformCallData(firebaseCall);
          
          const call = new Call(mongoCall);
          batch.push(call);
          batchCount++;

          if (batchCount >= BATCH_SIZE) {
            await Call.insertMany(batch);
            this.migrationStats.calls.migrated += batch.length;
            console.log(`✅ Migrated ${batch.length} calls`);
            batch.length = 0;
            batchCount = 0;
          }
        } catch (error) {
          console.error(`❌ Error migrating call ${doc.id}:`, error.message);
          this.migrationStats.calls.errors++;
        }
      }

      // Insert remaining calls
      if (batch.length > 0) {
        await Call.insertMany(batch);
        this.migrationStats.calls.migrated += batch.length;
        console.log(`✅ Migrated final ${batch.length} calls`);
      }

      console.log(`✅ Call migration completed: ${this.migrationStats.calls.migrated}/${this.migrationStats.calls.total}`);
    } catch (error) {
      console.error('❌ Call migration failed:', error.message);
      throw error;
    }
  }

  // Migrate transactions from Firebase to MongoDB
  async migrateTransactions() {
    console.log('🔄 Starting transaction migration...');
    
    try {
      const transactionsSnapshot = await this.db.collection('transactions').get();
      this.migrationStats.transactions.total = transactionsSnapshot.size;
      
      const batch = [];
      let batchCount = 0;
      const BATCH_SIZE = 100;

      for (const doc of transactionsSnapshot.docs) {
        try {
          const firebaseTransaction = { id: doc.id, ...doc.data() };
          
          // Skip transactions without userId
          if (!firebaseTransaction.userId) {
            console.log(`⚠️ Skipping transaction ${doc.id} - no userId`);
            this.migrationStats.transactions.errors++;
            continue;
          }
          
          const mongoTransaction = await this.transformTransactionData(firebaseTransaction);
          
          const transaction = new Transaction(mongoTransaction);
          batch.push(transaction);
          batchCount++;

          if (batchCount >= BATCH_SIZE) {
            try {
              await Transaction.insertMany(batch);
              this.migrationStats.transactions.migrated += batch.length;
              console.log(`✅ Migrated ${batch.length} transactions`);
            } catch (batchError) {
              // Handle batch errors by processing individually
              console.log(`⚠️ Batch insert failed, processing individually...`);
              for (const singleTransaction of batch) {
                try {
                  await singleTransaction.save();
                  this.migrationStats.transactions.migrated++;
                } catch (singleError) {
                  console.error(`❌ Error saving individual transaction:`, singleError.message);
                  this.migrationStats.transactions.errors++;
                }
              }
            }
            batch.length = 0;
            batchCount = 0;
          }
        } catch (error) {
          console.error(`❌ Error migrating transaction ${doc.id}:`, error.message);
          this.migrationStats.transactions.errors++;
        }
      }

      // Insert remaining transactions
      if (batch.length > 0) {
        try {
          await Transaction.insertMany(batch);
          this.migrationStats.transactions.migrated += batch.length;
          console.log(`✅ Migrated final ${batch.length} transactions`);
        } catch (batchError) {
          // Handle batch errors by processing individually
          console.log(`⚠️ Final batch insert failed, processing individually...`);
          for (const singleTransaction of batch) {
            try {
              await singleTransaction.save();
              this.migrationStats.transactions.migrated++;
            } catch (singleError) {
              console.error(`❌ Error saving individual transaction:`, singleError.message);
              this.migrationStats.transactions.errors++;
            }
          }
        }
      }

      console.log(`✅ Transaction migration completed: ${this.migrationStats.transactions.migrated}/${this.migrationStats.transactions.total}`);
    } catch (error) {
      console.error('❌ Transaction migration failed:', error.message);
      throw error;
    }
  }

  // Create coin wallets for migrated users
  async createCoinWallets() {
    console.log('🔄 Creating coin wallets for migrated users...');
    
    try {
      const users = await User.find({});
      const batch = [];
      
      for (const user of users) {
        const existingWallet = await Coin.findOne({ userId: user._id });
        if (!existingWallet) {
          const coinWallet = new Coin({
            userId: user._id,
            balance: 0,
            totalPurchased: 0,
            totalSpent: 0,
            totalEarned: 0,
            lastUpdated: new Date()
          });
          batch.push(coinWallet);
        }
      }

      if (batch.length > 0) {
        await Coin.insertMany(batch);
        console.log(`✅ Created ${batch.length} coin wallets`);
      }
    } catch (error) {
      console.error('❌ Coin wallet creation failed:', error.message);
      throw error;
    }
  }

  // Run complete migration
  async runMigration() {
    console.log('🚀 Starting Firebase to MongoDB migration...');
    console.log('=====================================');
    
    try {
      await this.migrateUsers();
      await this.migrateCalls();
      await this.migrateTransactions();
      await this.createCoinWallets();
      
      console.log('=====================================');
      console.log('🎉 Migration completed successfully!');
      console.log('📊 Migration Statistics:');
      console.log(`   Users: ${this.migrationStats.users.migrated}/${this.migrationStats.users.total}`);
      console.log(`   Calls: ${this.migrationStats.calls.migrated}/${this.migrationStats.calls.total}`);
      console.log(`   Transactions: ${this.migrationStats.transactions.migrated}/${this.migrationStats.transactions.total}`);
      console.log(`   Errors: ${this.migrationStats.users.errors + this.migrationStats.calls.errors + this.migrationStats.transactions.errors}`);
      
    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      throw error;
    } finally {
      await mongoose.disconnect();
      process.exit(0);
    }
  }
}

// Run migration if called directly
if (require.main === module) {
  const migrator = new FirebaseToMongoDBMigrator();
  migrator.runMigration().catch(console.error);
}

module.exports = FirebaseToMongoDBMigrator;
