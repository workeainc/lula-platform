const express = require('express');
const Withdrawal = require('../models/Withdrawal');
const User = require('../models/User');
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

// ==================== WITHDRAWAL MANAGEMENT ====================

// Get all withdrawals with pagination and filters
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      userId,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build filter object
    const filter = {};
    
    if (status) filter.status = status;
    if (userId) filter.userId = userId;
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const withdrawals = await Withdrawal.find(filter)
      .populate('userId', 'name phoneNumber email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Withdrawal.countDocuments(filter);
    
    res.json({
      error: false,
      withdrawals,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('Get withdrawals error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to get withdrawals'
    });
  }
});

// Get withdrawal details by ID
router.get('/:withdrawalId', async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    
    const withdrawal = await Withdrawal.findById(withdrawalId)
      .populate('userId', 'name phoneNumber email profileImage');
    
    if (!withdrawal) {
      return res.status(404).json({
        error: true,
        message: 'Withdrawal not found'
      });
    }
    
    res.json({
      error: false,
      withdrawal
    });
    
  } catch (error) {
    console.error('Get withdrawal details error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to get withdrawal details'
    });
  }
});

// Update withdrawal status
router.put('/:withdrawalId', async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const { status, adminNotes } = req.body;
    
    if (!['pending', 'completed', 'rejected'].includes(status)) {
      return res.status(400).json({
        error: true,
        message: 'Invalid status. Must be pending, completed, or rejected'
      });
    }
    
    const withdrawal = await Withdrawal.findById(withdrawalId);
    
    if (!withdrawal) {
      return res.status(404).json({
        error: true,
        message: 'Withdrawal not found'
      });
    }
    
    // Update withdrawal status
    withdrawal.status = status;
    withdrawal.adminNotes = adminNotes;
    withdrawal.processedAt = new Date();
    withdrawal.processedBy = req.user._id;
    
    await withdrawal.save();
    
    // If status is completed, we might want to send a notification
    // or update user's withdrawal history
    
    res.json({
      error: false,
      message: `Withdrawal ${status} successfully`,
      withdrawal
    });
    
  } catch (error) {
    console.error('Update withdrawal status error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to update withdrawal status'
    });
  }
});

// Get withdrawal analytics
router.get('/analytics/overview', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const filter = {};
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    
    // Total withdrawals
    const totalWithdrawals = await Withdrawal.countDocuments(filter);
    
    // Withdrawals by status
    const withdrawalsByStatus = await Withdrawal.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } }
    ]);
    
    // Total withdrawal amount
    const totalAmount = await Withdrawal.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    // Pending withdrawals count
    const pendingWithdrawals = await Withdrawal.countDocuments({ 
      ...filter, 
      status: 'pending' 
    });
    
    // Daily withdrawal trends (last 30 days)
    const dailyTrends = await Withdrawal.aggregate([
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
        totalWithdrawals,
        withdrawalsByStatus,
        totalAmount: totalAmount[0]?.total || 0,
        pendingWithdrawals,
        dailyTrends
      }
    });
    
  } catch (error) {
    console.error('Get withdrawal analytics error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to get withdrawal analytics'
    });
  }
});

module.exports = router;
