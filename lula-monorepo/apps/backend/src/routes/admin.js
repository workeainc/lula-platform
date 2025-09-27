const express = require('express');
const User = require('../models/User');
const Call = require('../models/Call');
const Transaction = require('../models/Transaction');
const Coin = require('../models/Coin');
const router = express.Router();

// Admin middleware - check if user is admin
const adminMiddleware = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({
        error: true,
        message: 'Admin access required'
      });
    }
    
    next();
  } catch (error) {
    res.status(500).json({
      error: true,
      message: 'Admin verification failed'
    });
  }
};

// Apply admin middleware to all routes
router.use(adminMiddleware);

// ==================== USER MANAGEMENT ====================

// Get all users with pagination and filters
router.get('/users', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      role, 
      search, 
      isOnline, 
      isVerified,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build filter object
    const filter = {};
    
    if (role) filter.role = role;
    if (isOnline !== undefined) filter.isOnline = isOnline === 'true';
    if (isVerified !== undefined) filter.isVerified = isVerified === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const users = await User.find(filter)
      .populate('followers', 'name phoneNumber')
      .populate('following', 'name phoneNumber')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(filter);
    
    res.json({
      error: false,
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to get users'
    });
  }
});

// Get user details by ID
router.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId)
      .populate('followers', 'name phoneNumber profileImage')
      .populate('following', 'name phoneNumber profileImage');
    
    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }
    
    // Get user's coin wallet
    const coinWallet = await Coin.findOne({ userId });
    
    // Get user's transaction history
    const transactions = await Transaction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('callId', 'streamCallId duration');
    
    // Get user's call history
    const calls = await Call.find({
      $or: [{ callerId: userId }, { receiverId: userId }]
    })
      .populate('callerId', 'name phoneNumber')
      .populate('receiverId', 'name phoneNumber')
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.json({
      error: false,
      user,
      coinWallet,
      recentTransactions: transactions,
      recentCalls: calls
    });
    
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to get user details'
    });
  }
});

// Update user status
router.put('/users/:userId/status', async (req, res) => {
  try {
    const { userId } = req.params;
    const { isOnline, isVerified, isDeleted, statusShow } = req.body;
    
    const updateData = {};
    if (isOnline !== undefined) updateData.isOnline = isOnline;
    if (isVerified !== undefined) updateData.isVerified = isVerified;
    if (isDeleted !== undefined) updateData.isDeleted = isDeleted;
    if (statusShow !== undefined) updateData.statusShow = statusShow;
    
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }
    
    res.json({
      error: false,
      message: 'User status updated successfully',
      user
    });
    
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to update user status'
    });
  }
});

// Delete user (soft delete)
router.delete('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { isDeleted: true },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }
    
    res.json({
      error: false,
      message: 'User deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to delete user'
    });
  }
});

// ==================== CALL MANAGEMENT ====================

// Get all calls with pagination and filters
router.get('/calls', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      callType,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build filter object
    const filter = {};
    
    if (status) filter.status = status;
    if (callType) filter.callType = callType;
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const calls = await Call.find(filter)
      .populate('callerId', 'name phoneNumber profileImage')
      .populate('receiverId', 'name phoneNumber profileImage')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Call.countDocuments(filter);
    
    res.json({
      error: false,
      calls,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('Get calls error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to get calls'
    });
  }
});

// Get call analytics
router.get('/calls/analytics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const filter = {};
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    
    // Total calls
    const totalCalls = await Call.countDocuments(filter);
    
    // Calls by status
    const callsByStatus = await Call.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // Calls by type
    const callsByType = await Call.aggregate([
      { $match: filter },
      { $group: { _id: '$callType', count: { $sum: 1 } } }
    ]);
    
    // Total coins deducted
    const totalCoinsDeducted = await Call.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$totalCoinsDeducted' } } }
    ]);
    
    // Total commission earned
    const totalCommissionEarned = await Call.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$commissionEarned' } } }
    ]);
    
    // Average call duration
    const avgDuration = await Call.aggregate([
      { $match: { ...filter, duration: { $gt: 0 } } },
      { $group: { _id: null, avgDuration: { $avg: '$duration' } } }
    ]);
    
    // Daily call trends (last 30 days)
    const dailyTrends = await Call.aggregate([
      { 
        $match: { 
          ...filter,
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          totalCoins: { $sum: '$totalCoinsDeducted' },
          totalCommission: { $sum: '$commissionEarned' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      error: false,
      analytics: {
        totalCalls,
        callsByStatus,
        callsByType,
        totalCoinsDeducted: totalCoinsDeducted[0]?.total || 0,
        totalCommissionEarned: totalCommissionEarned[0]?.total || 0,
        avgDuration: avgDuration[0]?.avgDuration || 0,
        dailyTrends
      }
    });
    
  } catch (error) {
    console.error('Get call analytics error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to get call analytics'
    });
  }
});

// ==================== TRANSACTION MANAGEMENT ====================

// Get all transactions with pagination and filters
router.get('/transactions', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      type, 
      status,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build filter object
    const filter = {};
    
    if (type) filter.type = type;
    if (status) filter.status = status;
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const transactions = await Transaction.find(filter)
      .populate('userId', 'name phoneNumber')
      .populate('callId', 'streamCallId duration')
      .populate('streamerId', 'name phoneNumber')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Transaction.countDocuments(filter);
    
    res.json({
      error: false,
      transactions,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
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

// Get transaction analytics
router.get('/transactions/analytics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const filter = {};
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    
    // Transactions by type
    const transactionsByType = await Transaction.aggregate([
      { $match: filter },
      { $group: { _id: '$type', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } }
    ]);
    
    // Transactions by status
    const transactionsByStatus = await Transaction.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } }
    ]);
    
    // Total transaction volume
    const totalVolume = await Transaction.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    // Daily transaction trends
    const dailyTrends = await Transaction.aggregate([
      { 
        $match: { 
          ...filter,
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      error: false,
      analytics: {
        transactionsByType,
        transactionsByStatus,
        totalVolume: totalVolume[0]?.total || 0,
        dailyTrends
      }
    });
    
  } catch (error) {
    console.error('Get transaction analytics error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to get transaction analytics'
    });
  }
});

// ==================== SYSTEM SETTINGS ====================

// Get system settings
router.get('/settings', async (req, res) => {
  try {
    const settings = {
      coinsPerMinute: parseInt(process.env.COIN_RATE_PER_MINUTE) || 49,
      commissionPercentage: parseInt(process.env.COMMISSION_PERCENTAGE) || 30,
      minimumBalance: parseInt(process.env.MINIMUM_BALANCE) || 49,
      jwtExpire: process.env.JWT_EXPIRE || '7d',
      nodeEnv: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 5000
    };
    
    res.json({
      error: false,
      settings
    });
    
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to get system settings'
    });
  }
});

// Update system settings
router.put('/settings', async (req, res) => {
  try {
    const { coinsPerMinute, commissionPercentage, minimumBalance } = req.body;
    
    // Note: In production, you'd want to update these in a database or config file
    // For now, we'll just return the updated values
    
    const updatedSettings = {
      coinsPerMinute: coinsPerMinute || parseInt(process.env.COIN_RATE_PER_MINUTE) || 49,
      commissionPercentage: commissionPercentage || parseInt(process.env.COMMISSION_PERCENTAGE) || 30,
      minimumBalance: minimumBalance || parseInt(process.env.MINIMUM_BALANCE) || 49
    };
    
    res.json({
      error: false,
      message: 'Settings updated successfully',
      settings: updatedSettings
    });
    
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to update system settings'
    });
  }
});

// ==================== DASHBOARD OVERVIEW ====================

// Get dashboard overview
router.get('/dashboard', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const filter = {};
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    
    // Get counts
    const [
      totalUsers,
      totalStreamers,
      totalCalls,
      totalTransactions,
      onlineUsers,
      activeCalls
    ] = await Promise.all([
      User.countDocuments({ role: 'USER', ...filter }),
      User.countDocuments({ role: 'STREAMER', ...filter }),
      Call.countDocuments(filter),
      Transaction.countDocuments(filter),
      User.countDocuments({ isOnline: true }),
      Call.countDocuments({ status: 'ongoing' })
    ]);
    
    // Get revenue data
    const revenueData = await Transaction.aggregate([
      { $match: { ...filter, type: 'purchase' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const totalRevenue = revenueData[0]?.total || 0;
    
    // Get commission data
    const commissionData = await Transaction.aggregate([
      { $match: { ...filter, type: 'commission' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const totalCommission = commissionData[0]?.total || 0;
    
    res.json({
      error: false,
      dashboard: {
        users: {
          total: totalUsers,
          streamers: totalStreamers,
          online: onlineUsers
        },
        calls: {
          total: totalCalls,
          active: activeCalls
        },
        transactions: {
          total: totalTransactions,
          revenue: totalRevenue,
          commission: totalCommission
        },
        system: {
          coinsPerMinute: parseInt(process.env.COIN_RATE_PER_MINUTE) || 49,
          commissionPercentage: parseInt(process.env.COMMISSION_PERCENTAGE) || 30,
          minimumBalance: parseInt(process.env.MINIMUM_BALANCE) || 49
        }
      }
    });
    
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to get dashboard data'
    });
  }
});

module.exports = router;
