const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['purchase', 'deduction', 'withdrawal', 'commission', 'refund'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  balanceBefore: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  
  // For call-related transactions
  callId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Call',
    default: null
  },
  callDuration: {
    type: Number, // in minutes
    default: null
  },
  
  // For commission transactions
  streamerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  commissionRate: {
    type: Number,
    default: null
  },
  
  // Payment details
  paymentMethod: {
    type: String,
    enum: ['card', 'upi', 'wallet', 'bank_transfer', 'razorpay'],
    default: null
  },
  paymentId: {
    type: String,
    default: null
  },
  
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'completed'
  }
}, {
  timestamps: true
});

// Indexes for better performance
transactionSchema.index({ userId: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ callId: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
