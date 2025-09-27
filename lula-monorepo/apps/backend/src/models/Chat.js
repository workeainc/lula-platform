const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  // Chat participants
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['USER', 'STREAMER'],
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastSeen: {
      type: Date,
      default: Date.now
    }
  }],

  // Chat metadata
  chatType: {
    type: String,
    enum: ['user_streamer', 'group', 'support'],
    default: 'user_streamer'
  },

  // Chat status
  status: {
    type: String,
    enum: ['active', 'archived', 'blocked', 'deleted'],
    default: 'active'
  },

  // Last message info
  lastMessage: {
    content: String,
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    senderRole: {
      type: String,
      enum: ['USER', 'STREAMER']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'video', 'audio', 'file'],
      default: 'text'
    }
  },

  // Chat settings
  settings: {
    allowNotifications: {
      type: Boolean,
      default: true
    },
    muteUntil: {
      type: Date,
      default: null
    },
    autoDelete: {
      type: Boolean,
      default: false
    },
    deleteAfterDays: {
      type: Number,
      default: 30
    }
  },

  // Chat statistics
  stats: {
    totalMessages: {
      type: Number,
      default: 0
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: new Map()
    }
  },

  // Chat creation info
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Related call (if chat started from a call)
  relatedCallId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Call',
    default: null
  },

  // Stream.io channel ID (if using Stream.io for chat)
  streamChannelId: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better performance
chatSchema.index({ 'participants.userId': 1 });
chatSchema.index({ 'participants.role': 1 });
chatSchema.index({ status: 1 });
chatSchema.index({ 'lastMessage.timestamp': -1 });
chatSchema.index({ createdAt: -1 });
chatSchema.index({ relatedCallId: 1 });
chatSchema.index({ streamChannelId: 1 });

// Compound index for finding chats between specific users
chatSchema.index({ 
  'participants.userId': 1, 
  'participants.role': 1,
  status: 1 
});

// Virtual for getting the other participant
chatSchema.virtual('otherParticipant').get(function() {
  // This would be used to get the other user in a 1-on-1 chat
  // Implementation depends on how you want to use it
});

// Method to add participant
chatSchema.methods.addParticipant = function(userId, role) {
  const existingParticipant = this.participants.find(p => p.userId.toString() === userId.toString());
  if (!existingParticipant) {
    this.participants.push({
      userId,
      role,
      joinedAt: new Date(),
      lastSeen: new Date()
    });
  }
  return this.save();
};

// Method to remove participant
chatSchema.methods.removeParticipant = function(userId) {
  this.participants = this.participants.filter(p => p.userId.toString() !== userId.toString());
  return this.save();
};

// Method to update last seen
chatSchema.methods.updateLastSeen = function(userId) {
  const participant = this.participants.find(p => p.userId.toString() === userId.toString());
  if (participant) {
    participant.lastSeen = new Date();
    return this.save();
  }
};

// Method to increment unread count
chatSchema.methods.incrementUnreadCount = function(userId) {
  if (!this.stats.unreadCount) {
    this.stats.unreadCount = new Map();
  }
  const currentCount = this.stats.unreadCount.get(userId.toString()) || 0;
  this.stats.unreadCount.set(userId.toString(), currentCount + 1);
  return this.save();
};

// Method to reset unread count
chatSchema.methods.resetUnreadCount = function(userId) {
  if (!this.stats.unreadCount) {
    this.stats.unreadCount = new Map();
  }
  this.stats.unreadCount.set(userId.toString(), 0);
  return this.save();
};

module.exports = mongoose.model('Chat', chatSchema);
