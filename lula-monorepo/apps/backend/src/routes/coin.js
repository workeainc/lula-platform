const express = require('express');
const Coin = require('../models/Coin');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const router = express.Router();

// Get user's coin balance
router.get('/balance/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    let coinWallet = await Coin.findOne({ userId });
    
    if (!coinWallet) {
      // Create new wallet if doesn't exist
      coinWallet = new Coin({
        userId,
        balance: 0
      });
      await coinWallet.save();
    }
    
    res.json({
      error: false,
      balance: coinWallet.balance,
      totalEarned: coinWallet.totalEarned,
      totalSpent: coinWallet.totalSpent
    });
    
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to get balance'
    });
  }
});

// Purchase coins
router.post('/purchase', async (req, res) => {
  try {
    const { userId, amount, paymentMethod, paymentId } = req.body;
    
    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({
        error: true,
        message: 'Valid user ID and amount are required'
      });
    }
    
    // Get or create coin wallet
    let coinWallet = await Coin.findOne({ userId });
    if (!coinWallet) {
      coinWallet = new Coin({
        userId,
        balance: 0
      });
    }
    
    const balanceBefore = coinWallet.balance;
    const balanceAfter = balanceBefore + amount;
    
    // Update wallet
    coinWallet.balance = balanceAfter;
    coinWallet.totalEarned += amount;
    coinWallet.lastUpdated = new Date();
    await coinWallet.save();
    
    // Create transaction record
    const transaction = new Transaction({
      userId,
      type: 'purchase',
      amount,
      balanceBefore,
      balanceAfter,
      description: `Purchased ${amount} coins`,
      paymentMethod,
      paymentId,
      status: 'completed'
    });
    await transaction.save();
    
    res.json({
      error: false,
      message: 'Coins purchased successfully',
      balance: coinWallet.balance,
      transactionId: transaction._id
    });
    
  } catch (error) {
    console.error('Purchase coins error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to purchase coins'
    });
  }
});

// Deduct coins (for calls)
router.post('/deduct', async (req, res) => {
  try {
    const { userId, amount, callId, description } = req.body;
    
    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({
        error: true,
        message: 'Valid user ID and amount are required'
      });
    }
    
    // Get coin wallet
    const coinWallet = await Coin.findOne({ userId });
    if (!coinWallet) {
      return res.status(404).json({
        error: true,
        message: 'Coin wallet not found'
      });
    }
    
    // Check if user has sufficient balance
    if (coinWallet.balance < amount) {
      return res.status(400).json({
        error: true,
        message: 'Insufficient balance',
        currentBalance: coinWallet.balance,
        requiredAmount: amount
      });
    }
    
    const balanceBefore = coinWallet.balance;
    const balanceAfter = balanceBefore - amount;
    
    // Update wallet
    coinWallet.balance = balanceAfter;
    coinWallet.totalSpent += amount;
    coinWallet.lastUpdated = new Date();
    await coinWallet.save();
    
    // Create transaction record
    const transaction = new Transaction({
      userId,
      type: 'deduction',
      amount: -amount, // Negative for deduction
      balanceBefore,
      balanceAfter,
      description: description || `Deducted ${amount} coins for call`,
      callId,
      status: 'completed'
    });
    await transaction.save();
    
    res.json({
      error: false,
      message: 'Coins deducted successfully',
      balance: coinWallet.balance,
      transactionId: transaction._id
    });
    
  } catch (error) {
    console.error('Deduct coins error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to deduct coins'
    });
  }
});

// Get transaction history
router.get('/transactions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const transactions = await Transaction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('callId', 'callType duration startTime')
      .populate('streamerId', 'name profileImage');
    
    const total = await Transaction.countDocuments({ userId });
    
    res.json({
      error: false,
      transactions,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
    
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to get transactions'
    });
  }
});

// Check if user has minimum balance for call
router.post('/check-balance', async (req, res) => {
  try {
    const { userId, callType = 'voice' } = req.body;
    
    const coinWallet = await Coin.findOne({ userId });
    if (!coinWallet) {
      return res.status(404).json({
        error: true,
        message: 'Coin wallet not found'
      });
    }
    
    const minimumBalance = parseInt(process.env.MINIMUM_BALANCE) || 49;
    const hasMinimumBalance = coinWallet.balance >= minimumBalance;
    
    res.json({
      error: false,
      hasMinimumBalance,
      currentBalance: coinWallet.balance,
      minimumBalance,
      canMakeCall: hasMinimumBalance
    });
    
  } catch (error) {
    console.error('Check balance error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to check balance'
    });
  }
});

module.exports = router;
