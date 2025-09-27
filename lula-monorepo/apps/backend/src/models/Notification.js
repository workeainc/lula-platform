const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Recipient information
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  recipientRole: {
    type: String,
    enum: ['USER', 'STREAMER', 'ADMIN'],
    required: true
  },

  // Notification content
  title: {
    type: String,
    required: true
  },

  body: {
    type: String,
    required: true
  },

  // Notification type
  type: {
    type: String,
    enum: [
      'call_incoming',
      'call_accepted',
      'call_ended',
      'call_declined',
      'message_received',
      'message_sent',
      'follow_received',
      'follow_sent',
      'coin_purchased',
      'coin_deducted',
      'commission_earned',
      'payment_received',
      'payment_sent',
      'system_announcement',
      'profile_updated',
      'stream_started',
      'stream_ended'
    ],
    required: true
  },

  // Notification data
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Related entities
  relatedEntity: {
    entityType: {
      type: String,
      enum: ['call', 'message', 'chat', 'user', 'transaction', 'stream'],
      default: null
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    }
  },

  // Sender information (for notifications from other users)
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  senderName: {
    type: String,
    default: null
  },

  senderImage: {
    type: String,
    default: null
  },

  // Notification status
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed', 'read'],
    default: 'pending'
  },

  // Delivery information
  deliveryInfo: {
    fcmSent: {
      type: Boolean,
      default: false
    },
    expoSent: {
      type: Boolean,
      default: false
    },
    fcmMessageId: {
      type: String,
      default: null
    },
    expoMessageId: {
      type: String,
      default: null
    },
    sentAt: {
      type: Date,
      default: null
    },
    deliveredAt: {
      type: Date,
      default: null
    },
    readAt: {
      type: Date,
      default: null
    },
    failureReason: {
      type: String,
      default: null
    }
  },

  // Notification priority
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },

  // Notification channels
  channels: {
    push: {
      type: Boolean,
      default: true
    },
    inApp: {
      type: Boolean,
      default: true
    },
    email: {
      type: Boolean,
      default: false
    },
    sms: {
      type: Boolean,
      default: false
    }
  },

  // Notification settings
  settings: {
    sound: {
      type: String,
      default: 'default'
    },
    badge: {
      type: Number,
      default: 1
    },
    vibrate: {
      type: Boolean,
      default: true
    },
    silent: {
      type: Boolean,
      default: false
    },
    category: {
      type: String,
      default: null
    }
  },

  // Notification actions
  actions: [{
    id: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    action: {
      type: String,
      enum: ['accept', 'decline', 'reply', 'view', 'dismiss'],
      required: true
    },
    url: {
      type: String,
      default: null
    }
  }],

  // Scheduling
  scheduledFor: {
    type: Date,
    default: null
  },

  // Expiration
  expiresAt: {
    type: Date,
    default: function() {
      // Default expiration: 7 days from now
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
  },

  // Retry information
  retryInfo: {
    attempts: {
      type: Number,
      default: 0
    },
    maxAttempts: {
      type: Number,
      default: 3
    },
    nextRetryAt: {
      type: Date,
      default: null
    }
  }
}, {
  timestamps: true
});

// Indexes for better performance
notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ status: 1 });
notificationSchema.index({ 'relatedEntity.entityType': 1, 'relatedEntity.entityId': 1 });
notificationSchema.index({ scheduledFor: 1 });
notificationSchema.index({ expiresAt: 1 });
notificationSchema.index({ 'retryInfo.nextRetryAt': 1 });

// Compound indexes
notificationSchema.index({ 
  recipientId: 1, 
  status: 1, 
  createdAt: -1 
});

notificationSchema.index({ 
  type: 1, 
  status: 1, 
  createdAt: -1 
});

// Virtual for notification age
notificationSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// Virtual for is expired
notificationSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.status = 'read';
  this.deliveryInfo.readAt = new Date();
  return this.save();
};

// Method to mark as delivered
notificationSchema.methods.markAsDelivered = function() {
  this.status = 'delivered';
  this.deliveryInfo.deliveredAt = new Date();
  return this.save();
};

// Method to mark as failed
notificationSchema.methods.markAsFailed = function(reason) {
  this.status = 'failed';
  this.deliveryInfo.failureReason = reason;
  return this.save();
};

// Method to increment retry attempts
notificationSchema.methods.incrementRetry = function() {
  this.retryInfo.attempts += 1;
  if (this.retryInfo.attempts < this.retryInfo.maxAttempts) {
    // Exponential backoff: 1min, 5min, 15min
    const delay = Math.pow(5, this.retryInfo.attempts) * 60 * 1000;
    this.retryInfo.nextRetryAt = new Date(Date.now() + delay);
    this.status = 'pending';
  }
  return this.save();
};

// Static method to get notifications for a user
notificationSchema.statics.getUserNotifications = function(userId, options = {}) {
  const { page = 1, limit = 20, type, status, unreadOnly = false } = options;
  const skip = (page - 1) * limit;

  const query = {
    recipientId: userId,
    expiresAt: { $gt: new Date() } // Only non-expired notifications
  };

  if (type) query.type = type;
  if (status) query.status = status;
  if (unreadOnly) query.status = { $ne: 'read' };

  return this.find(query)
    .populate('senderId', 'name profileImage')
    .populate('relatedEntity.entityId')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    recipientId: userId,
    status: { $ne: 'read' },
    expiresAt: { $gt: new Date() }
  });
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    {
      recipientId: userId,
      status: { $ne: 'read' }
    },
    {
      $set: {
        status: 'read',
        'deliveryInfo.readAt': new Date()
      }
    }
  );
};

// Static method to get pending notifications for retry
notificationSchema.statics.getPendingForRetry = function() {
  return this.find({
    status: 'pending',
    $or: [
      { 'retryInfo.nextRetryAt': { $lte: new Date() } },
      { 'retryInfo.nextRetryAt': { $exists: false } }
    ],
    'retryInfo.attempts': { $lt: 3 },
    expiresAt: { $gt: new Date() }
  });
};

// Static method to cleanup expired notifications
notificationSchema.statics.cleanupExpired = function() {
  return this.deleteMany({
    expiresAt: { $lte: new Date() }
  });
};

module.exports = mongoose.model('Notification', notificationSchema);
