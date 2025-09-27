const mongoose = require('mongoose');

const callSchema = new mongoose.Schema({
  callerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  callType: {
    type: String,
    enum: ['voice', 'video'],
    required: true
  },
  
  // Stream.io call details
  streamCallId: {
    type: String,
    required: true
  },
  streamChannelId: {
    type: String,
    default: null
  },
  
  // Call status
  status: {
    type: String,
    enum: ['initiated', 'ringing', 'accepted', 'ongoing', 'ended', 'missed', 'declined'],
    default: 'initiated'
  },
  
  // Timing
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date,
    default: null
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  
  // Billing
  coinsPerMinute: {
    type: Number,
    default: 49
  },
  totalCoinsDeducted: {
    type: Number,
    default: 0
  },
  commissionEarned: {
    type: Number,
    default: 0
  },
  
  // Real-time tracking
  isActive: {
    type: Boolean,
    default: true
  },
  lastMinuteBilled: {
    type: Number,
    default: 0
  },
  
  // Call quality metrics
  quality: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor'],
    default: null
  },
  
  // End reason
  endReason: {
    type: String,
    enum: ['normal', 'timeout', 'insufficient_balance', 'user_disconnected', 'network_error'],
    default: 'normal'
  }
}, {
  timestamps: true
});

// Indexes for better performance
callSchema.index({ callerId: 1 });
callSchema.index({ receiverId: 1 });
callSchema.index({ status: 1 });
callSchema.index({ startTime: -1 });
callSchema.index({ streamCallId: 1 });
callSchema.index({ streamChannelId: 1 });

module.exports = mongoose.model('Call', callSchema);
