const mongoose = require('mongoose');
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seedAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lula');
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'ADMIN' });
    if (existingAdmin) {
      console.log('⚠️ Admin user already exists:', existingAdmin.phoneNumber);
      console.log('📱 Phone:', existingAdmin.phoneNumber);
      console.log('🔑 User ID:', existingAdmin._id);
      return;
    }

    // Create admin user
    const adminUser = new User({
      phoneNumber: '+1234567890', // Default admin phone
      name: 'Admin User',
      role: 'ADMIN',
      isVerified: true,
      isActive: true,
      balance: 0,
      totalEarnings: 0,
      profileImage: null,
      bio: 'System Administrator',
      // Notification settings
      notificationSettings: {
        pushNotifications: true,
        inAppNotifications: true,
        callNotifications: true,
        messageNotifications: true,
        followNotifications: true,
        transactionNotifications: true,
        systemNotifications: true
      }
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully!');
    console.log('📱 Phone:', adminUser.phoneNumber);
    console.log('🔑 User ID:', adminUser._id);
    console.log('👤 Name:', adminUser.name);
    console.log('🔐 Role:', adminUser.role);

    // Generate JWT token for testing
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { userId: adminUser._id },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    console.log('\n🔑 JWT Token for testing:');
    console.log(token);
    console.log('\n📋 Use this token in your admin app:');
    console.log('Authorization: Bearer ' + token);

  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the seed function
seedAdminUser();
