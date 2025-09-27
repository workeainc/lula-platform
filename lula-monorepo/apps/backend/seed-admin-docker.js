const mongoose = require('mongoose');
const User = require('./src/models/User');
const jwt = require('jsonwebtoken');

async function seedAdminUserDocker() {
  try {
    // Connect to Docker MongoDB
    const MONGODB_URI = 'mongodb://admin:password@localhost:27019/lula?authSource=admin';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to Docker MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'ADMIN' });
    if (existingAdmin) {
      console.log('⚠️ Admin user already exists:', existingAdmin.phoneNumber);
      console.log('📱 Phone:', existingAdmin.phoneNumber);
      console.log('🔑 User ID:', existingAdmin._id);
      
      // Generate token for existing admin
      const JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production-docker';
      const token = jwt.sign(
        { userId: existingAdmin._id },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      console.log('\n🔑 JWT Token for existing admin:');
      console.log(token);
      return;
    }

    // Create admin user
    const adminUser = new User({
      phoneNumber: '+1234567890',
      name: 'Admin User',
      role: 'ADMIN',
      isVerified: true,
      isActive: true,
      balance: 0,
      totalEarnings: 0,
      profileImage: null,
      bio: 'System Administrator',
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
    console.log('✅ Admin user created successfully in Docker MongoDB!');
    console.log('📱 Phone:', adminUser.phoneNumber);
    console.log('🔑 User ID:', adminUser._id);

    // Generate JWT token
    const JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production-docker';
    const token = jwt.sign(
      { userId: adminUser._id },
      JWT_SECRET,
      { expiresIn: '7d' }
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
seedAdminUserDocker();
