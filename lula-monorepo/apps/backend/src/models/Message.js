const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // Chat reference
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },

  // Message sender
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.senderRole !== 'SYSTEM';
    }
  },

  senderRole: {
    type: String,
    enum: ['USER', 'STREAMER', 'SYSTEM'],
    required: true
  },

  // Message content
  content: {
    type: String,
    required: function() {
      return this.messageType === 'text';
    }
  },

  // Message type
  messageType: {
    type: String,
    enum: ['text', 'image', 'video', 'audio', 'file', 'system'],
    default: 'text'
  },

  // Media attachments
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'video', 'audio', 'file'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    filename: String,
    size: Number,
    mimeType: String,
    thumbnail: String, // For videos/images
    duration: Number, // For audio/video
    dimensions: {
      width: Number,
      height: Number
    }
  }],

  // Message status
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  },

  // Read receipts
  readBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Message metadata
  metadata: {
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: Date,
    originalContent: String,
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    forwardedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    }
  },

  // Message reactions
  reactions: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // System message data
  systemData: {
    type: {
      type: String,
      enum: ['chat_created', 'user_joined', 'user_left', 'call_started', 'call_ended', 'payment_sent', 'payment_received']
    },
    data: mongoose.Schema.Types.Mixed
  },

  // Message encryption (for future use)
  encryption: {
    isEncrypted: {
      type: Boolean,
      default: false
    },
    encryptionKey: String,
    algorithm: String
  },

  // Message flags
  flags: {
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: Date,
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    isReported: {
      type: Boolean,
      default: false
    },
    reportedBy: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      reason: String,
      reportedAt: {
        type: Date,
        default: Date.now
      }
    }]
  }
}, {
  timestamps: true
});

// Indexes for better performance
messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1 });
messageSchema.index({ status: 1 });
messageSchema.index({ messageType: 1 });
messageSchema.index({ 'readBy.userId': 1 });
messageSchema.index({ 'flags.isDeleted': 1 });
messageSchema.index({ 'flags.isReported': 1 });

// Compound index for chat messages with pagination
messageSchema.index({ 
  chatId: 1, 
  createdAt: -1,
  'flags.isDeleted': 1 
});

// Method to mark as read
messageSchema.methods.markAsRead = function(userId) {
  const existingRead = this.readBy.find(r => r.userId.toString() === userId.toString());
  if (!existingRead) {
    this.readBy.push({
      userId,
      readAt: new Date()
    });
    this.status = 'read';
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to add reaction
messageSchema.methods.addReaction = function(userId, emoji) {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter(r => r.userId.toString() !== userId.toString());
  
  // Add new reaction
  this.reactions.push({
    userId,
    emoji,
    createdAt: new Date()
  });
  
  return this.save();
};

// Method to remove reaction
messageSchema.methods.removeReaction = function(userId) {
  this.reactions = this.reactions.filter(r => r.userId.toString() !== userId.toString());
  return this.save();
};

// Method to edit message
messageSchema.methods.editMessage = function(newContent, userId) {
  if (this.senderId.toString() !== userId.toString()) {
    throw new Error('Only the sender can edit the message');
  }
  
  this.metadata.originalContent = this.content;
  this.content = newContent;
  this.metadata.isEdited = true;
  this.metadata.editedAt = new Date();
  
  return this.save();
};

// Method to delete message
messageSchema.methods.deleteMessage = function(userId) {
  this.flags.isDeleted = true;
  this.flags.deletedAt = new Date();
  this.flags.deletedBy = userId;
  return this.save();
};

// Method to report message
messageSchema.methods.reportMessage = function(userId, reason) {
  const existingReport = this.flags.reportedBy.find(r => r.userId.toString() === userId.toString());
  if (!existingReport) {
    this.flags.reportedBy.push({
      userId,
      reason,
      reportedAt: new Date()
    });
    this.flags.isReported = true;
    return this.save();
  }
  return Promise.resolve(this);
};

// Static method to get messages for a chat with pagination
messageSchema.statics.getChatMessages = function(chatId, page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  
  return this.find({
    chatId,
    'flags.isDeleted': false
  })
  .populate('senderId', 'name profileImage')
  .populate({
    path: 'replyTo',
    select: 'content senderId',
    populate: {
      path: 'senderId',
      select: 'name'
    }
  })
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit);
};

// Static method to get unread message count for a user
messageSchema.statics.getUnreadCount = function(chatId, userId) {
  return this.countDocuments({
    chatId,
    senderId: { $ne: userId },
    'readBy.userId': { $ne: userId },
    'flags.isDeleted': false
  });
};

module.exports = mongoose.model('Message', messageSchema);
