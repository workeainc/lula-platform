const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['bank_transfer', 'paypal', 'stripe', 'crypto', 'other']
  },
  paymentDetails: {
    // Bank transfer details
    bankName: String,
    accountNumber: String,
    routingNumber: String,
    accountHolderName: String,
    
    // PayPal details
    paypalEmail: String,
    
    // Stripe details
    stripeAccountId: String,
    
    // Crypto details
    cryptoAddress: String,
    cryptoType: String,
    
    // Other payment details
    otherDetails: String
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'rejected', 'cancelled'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    default: ''
  },
  processedAt: {
    type: Date
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: {
    type: String
  },
  transactionId: {
    type: String // External payment processor transaction ID
  },
  fees: {
    type: Number,
    default: 0
  },
  netAmount: {
    type: Number // Amount after fees
  }
}, {
  timestamps: true
});

// Calculate net amount before saving
withdrawalSchema.pre('save', function(next) {
  if (this.isModified('amount') || this.isModified('fees')) {
    this.netAmount = this.amount - (this.fees || 0);
  }
  next();
});

// Index for better query performance
withdrawalSchema.index({ userId: 1, status: 1 });
withdrawalSchema.index({ status: 1, createdAt: -1 });
withdrawalSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Withdrawal', withdrawalSchema);
