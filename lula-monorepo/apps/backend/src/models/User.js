const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Basic Information
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['USER', 'STREAMER', 'ADMIN'],
    required: true
  },
  
  // Profile Information
  name: {
    type: String,
    trim: true
  },
  age: {
    type: Number,
    min: 18,
    max: 100
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  bio: {
    type: String,
    maxlength: 500
  },
  
  // Media
  profileImage: {
    type: String,
    default: null
  },
  profileVideo: {
    type: String,
    default: null
  },
  images: [{
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  videos: [{
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Location
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  
  // Social Features
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Status
  isOnline: {
    type: Boolean,
    default: false
  },
  statusShow: {
    type: String,
    default: 'online'
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },

  // Notification tokens
  fcmToken: {
    type: String,
    default: null
  },
  fcmTokenUpdatedAt: {
    type: Date,
    default: null
  },
  expoPushToken: {
    type: String,
    default: null
  },
  expoTokenUpdatedAt: {
    type: Date,
    default: null
  },

  // Notification preferences
  notificationSettings: {
    pushNotifications: {
      type: Boolean,
      default: true
    },
    inAppNotifications: {
      type: Boolean,
      default: true
    },
    callNotifications: {
      type: Boolean,
      default: true
    },
    messageNotifications: {
      type: Boolean,
      default: true
    },
    followNotifications: {
      type: Boolean,
      default: true
    },
    transactionNotifications: {
      type: Boolean,
      default: true
    },
    systemNotifications: {
      type: Boolean,
      default: true
    }
  },
  
  // Timestamps
  lastLoginAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better performance
userSchema.index({ phoneNumber: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isOnline: 1 });
userSchema.index({ isDeleted: 1 });

module.exports = mongoose.model('User', userSchema);
