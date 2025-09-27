const express = require('express');
const Call = require('../models/Call');
const Coin = require('../models/Coin');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const RealTimeBillingService = require('../services/RealTimeBillingService');
const StreamService = require('../services/StreamService');
const NotificationService = require('../services/NotificationService');
const router = express.Router();

// Initialize real-time billing service
let billingService = null;

// Initialize billing service with Socket.io instance
const initializeBillingService = (io) => {
  if (!billingService) {
    billingService = new RealTimeBillingService(io);
    billingService.startCleanupInterval();
    console.log('✅ Real-time billing service initialized');
  }
  return billingService;
};

// Export function to initialize billing service
router.initializeBillingService = initializeBillingService;

// Initiate a call
router.post('/initiate', async (req, res) => {
  try {
    const { callerId, receiverId, callType = 'voice' } = req.body;
    
    if (!callerId || !receiverId) {
      return res.status(400).json({
        error: true,
        message: 'Caller ID and Receiver ID are required'
      });
    }
    
    // Check if caller has minimum balance
    const coinWallet = await Coin.findOne({ userId: callerId });
    if (!coinWallet || coinWallet.balance < parseInt(process.env.MINIMUM_BALANCE) || 49) {
      return res.status(400).json({
        error: true,
        message: 'Insufficient balance to make call',
        currentBalance: coinWallet?.balance || 0,
        minimumRequired: 49
      });
    }
    
    // Check if receiver is online
    const receiver = await User.findById(receiverId);
    if (!receiver || !receiver.isOnline || receiver.isDeleted) {
      return res.status(400).json({
        error: true,
        message: 'Receiver is not available'
      });
    }
    
    // Generate unique call ID
    const streamCallId = `call_${Date.now()}_${callerId}_${receiverId}`;
    
    // Create Stream.io call channel if configured
    let streamChannelId = null;
    if (StreamService.isConfigured()) {
      try {
        const callChannel = await StreamService.createCallChannel(callerId, receiverId, callType);
        streamChannelId = callChannel.channelId;
        console.log(`✅ Created Stream.io channel: ${streamChannelId}`);
      } catch (error) {
        console.warn('⚠️ Failed to create Stream.io channel:', error.message);
      }
    }
    
    // Create call record
    const call = new Call({
      callerId,
      receiverId,
      callType,
      streamCallId,
      streamChannelId, // Add Stream.io channel ID
      status: 'initiated',
      coinsPerMinute: parseInt(process.env.COIN_RATE_PER_MINUTE) || 49
    });
    
    await call.save();

    // Send call notification to receiver
    try {
      const notificationService = new NotificationService();
      await notificationService.sendCallNotification(
        receiverId,
        callerId,
        callType,
        call._id.toString()
      );
      console.log(`✅ Call notification sent to user: ${receiverId}`);
    } catch (error) {
      console.warn('⚠️ Failed to send call notification:', error.message);
    }
    
    res.json({
      error: false,
      message: 'Call initiated successfully',
      call: {
        id: call._id,
        streamCallId: call.streamCallId,
        streamChannelId: call.streamChannelId, // Include Stream.io channel ID
        callerId: call.callerId,
        receiverId: call.receiverId,
        callType: call.callType,
        status: call.status,
        coinsPerMinute: call.coinsPerMinute
      }
    });
    
  } catch (error) {
    console.error('Initiate call error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to initiate call'
    });
  }
});

// Accept a call
router.post('/accept', async (req, res) => {
  try {
    const { callId, receiverId } = req.body;
    
    const call = await Call.findById(callId);
    if (!call) {
      return res.status(404).json({
        error: true,
        message: 'Call not found'
      });
    }
    
    if (call.receiverId.toString() !== receiverId) {
      return res.status(403).json({
        error: true,
        message: 'Unauthorized to accept this call'
      });
    }
    
    // Update call status
    call.status = 'accepted';
    call.startTime = new Date();
    await call.save();
    
    // Start real-time billing when call is accepted
    if (billingService) {
      try {
        await billingService.startBilling(callId);
        console.log(`✅ Started real-time billing for accepted call ${callId}`);
      } catch (error) {
        console.error(`❌ Failed to start billing for call ${callId}:`, error.message);
      }
    }
    
    res.json({
      error: false,
      message: 'Call accepted successfully',
      call: {
        id: call._id,
        streamCallId: call.streamCallId,
        status: call.status,
        startTime: call.startTime
      }
    });
    
  } catch (error) {
    console.error('Accept call error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to accept call'
    });
  }
});

// End a call
router.post('/end', async (req, res) => {
  try {
    const { callId, userId, endReason = 'normal' } = req.body;
    
    const call = await Call.findById(callId);
    if (!call) {
      return res.status(404).json({
        error: true,
        message: 'Call not found'
      });
    }
    
    // Check if user is part of this call
    if (call.callerId.toString() !== userId && call.receiverId.toString() !== userId) {
      return res.status(403).json({
        error: true,
        message: 'Unauthorized to end this call'
      });
    }
    
    // Stop real-time billing when call ends
    if (billingService) {
      try {
        await billingService.stopBilling(callId, endReason);
        console.log(`✅ Stopped real-time billing for ended call ${callId}`);
      } catch (error) {
        console.error(`❌ Failed to stop billing for call ${callId}:`, error.message);
      }
    }
    
    // Clean up Stream.io channel if exists
    if (call.streamChannelId && StreamService.isConfigured()) {
      try {
        await StreamService.endCall(callId, call.streamChannelId);
        console.log(`✅ Cleaned up Stream.io channel: ${call.streamChannelId}`);
      } catch (error) {
        console.warn('⚠️ Failed to clean up Stream.io channel:', error.message);
      }
    }
    
    // Calculate call duration
    const endTime = new Date();
    const duration = Math.floor((endTime - call.startTime) / 1000); // in seconds
    const durationMinutes = Math.ceil(duration / 60); // rounded up to minutes
    
    // Calculate coins to deduct
    const coinsToDeduct = durationMinutes * call.coinsPerMinute;
    const commissionEarned = Math.floor(coinsToDeduct * (parseInt(process.env.COMMISSION_PERCENTAGE) || 30) / 100);
    
    // Update call record
    call.status = 'ended';
    call.endTime = endTime;
    call.duration = duration;
    call.totalCoinsDeducted = coinsToDeduct;
    call.commissionEarned = commissionEarned;
    call.endReason = endReason;
    call.isActive = false;
    await call.save();
    
    // Deduct coins from caller
    const callerWallet = await Coin.findOne({ userId: call.callerId });
    if (callerWallet && coinsToDeduct > 0) {
      const balanceBefore = callerWallet.balance;
      const balanceAfter = balanceBefore - coinsToDeduct;
      
      callerWallet.balance = balanceAfter;
      callerWallet.totalSpent += coinsToDeduct;
      callerWallet.lastUpdated = new Date();
      await callerWallet.save();
      
      // Create transaction record
      const transaction = new Transaction({
        userId: call.callerId,
        type: 'deduction',
        amount: -coinsToDeduct,
        balanceBefore,
        balanceAfter,
        description: `Call deduction: ${durationMinutes} minutes`,
        callId: call._id,
        callDuration: durationMinutes,
        status: 'completed'
      });
      await transaction.save();
    }
    
    // Add commission to streamer
    const streamerWallet = await Coin.findOne({ userId: call.receiverId });
    if (streamerWallet && commissionEarned > 0) {
      const balanceBefore = streamerWallet.balance;
      const balanceAfter = balanceBefore + commissionEarned;
      
      streamerWallet.balance = balanceAfter;
      streamerWallet.totalEarned += commissionEarned;
      streamerWallet.lastUpdated = new Date();
      await streamerWallet.save();
      
      // Create commission transaction record
      const commissionTransaction = new Transaction({
        userId: call.receiverId,
        type: 'commission',
        amount: commissionEarned,
        balanceBefore,
        balanceAfter,
        description: `Commission earned: ${durationMinutes} minutes`,
        callId: call._id,
        callDuration: durationMinutes,
        streamerId: call.receiverId,
        commissionRate: parseInt(process.env.COMMISSION_PERCENTAGE) || 30,
        status: 'completed'
      });
      await commissionTransaction.save();
    }
    
    res.json({
      error: false,
      message: 'Call ended successfully',
      call: {
        id: call._id,
        duration,
        durationMinutes,
        coinsDeducted: coinsToDeduct,
        commissionEarned,
        endReason
      }
    });
    
  } catch (error) {
    console.error('End call error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to end call'
    });
  }
});

// Get call history
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const calls = await Call.find({
      $or: [{ callerId: userId }, { receiverId: userId }]
    })
      .sort({ startTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('callerId', 'name profileImage phoneNumber')
      .populate('receiverId', 'name profileImage phoneNumber');
    
    const total = await Call.countDocuments({
      $or: [{ callerId: userId }, { receiverId: userId }]
    });
    
    res.json({
      error: false,
      calls,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
    
  } catch (error) {
    console.error('Get call history error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to get call history'
    });
  }
});

// Get active calls
router.get('/active/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const activeCalls = await Call.find({
      $or: [{ callerId: userId }, { receiverId: userId }],
      status: { $in: ['initiated', 'accepted', 'ongoing'] },
      isActive: true
    })
      .populate('callerId', 'name profileImage')
      .populate('receiverId', 'name profileImage');
    
    res.json({
      error: false,
      activeCalls
    });
    
  } catch (error) {
    console.error('Get active calls error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to get active calls'
    });
  }
});

// Get billing status for a call
router.get('/billing/:callId', async (req, res) => {
  try {
    const { callId } = req.params;
    
    if (!billingService) {
      return res.status(503).json({
        error: true,
        message: 'Billing service not initialized'
      });
    }
    
    const billingStatus = billingService.getBillingStatus(callId);
    
    if (!billingStatus) {
      return res.status(404).json({
        error: true,
        message: 'No active billing found for this call'
      });
    }
    
    res.json({
      error: false,
      billing: billingStatus
    });
    
  } catch (error) {
    console.error('Get billing status error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to get billing status'
    });
  }
});

// Get all active billing sessions (admin only)
router.get('/billing/active/all', async (req, res) => {
  try {
    if (!billingService) {
      return res.status(503).json({
        error: true,
        message: 'Billing service not initialized'
      });
    }
    
    const activeBilling = billingService.getAllActiveBilling();
    
    res.json({
      error: false,
      activeBilling,
      count: activeBilling.length
    });
    
  } catch (error) {
    console.error('Get active billing error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to get active billing sessions'
    });
  }
});

module.exports = router;
