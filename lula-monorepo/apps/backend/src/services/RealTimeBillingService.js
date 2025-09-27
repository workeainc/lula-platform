const Call = require('../models/Call');
const Coin = require('../models/Coin');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

class RealTimeBillingService {
  constructor(io) {
    this.io = io;
    this.activeCalls = new Map(); // Map of callId -> billing info
    this.billingIntervals = new Map(); // Map of callId -> interval reference
    this.coinsPerMinute = parseInt(process.env.COIN_RATE_PER_MINUTE) || 49;
    this.commissionPercentage = parseInt(process.env.COMMISSION_PERCENTAGE) || 30;
  }

  // Start billing for a call
  async startBilling(callId) {
    try {
      const call = await Call.findById(callId);
      if (!call) {
        throw new Error(`Call ${callId} not found`);
      }

      if (call.status !== 'ongoing') {
        throw new Error(`Call ${callId} is not in ongoing status`);
      }

      // Check if billing is already active
      if (this.activeCalls.has(callId)) {
        console.log(`⚠️ Billing already active for call ${callId}`);
        return;
      }

      // Initialize billing data
      const billingData = {
        callId,
        callerId: call.callerId,
        receiverId: call.receiverId,
        startTime: new Date(),
        lastBilledMinute: 0,
        totalCoinsDeducted: 0,
        totalCommissionEarned: 0,
        isActive: true
      };

      this.activeCalls.set(callId, billingData);

      // Start per-minute billing interval
      const interval = setInterval(async () => {
        await this.processMinuteBilling(callId);
      }, 60000); // Every 60 seconds

      this.billingIntervals.set(callId, interval);

      console.log(`✅ Started real-time billing for call ${callId}`);
      
      // Emit billing started event
      this.io.to(call.callerId.toString()).emit('billing:started', {
        callId,
        coinsPerMinute: this.coinsPerMinute,
        message: 'Real-time billing started'
      });

      this.io.to(call.receiverId.toString()).emit('billing:started', {
        callId,
        coinsPerMinute: this.coinsPerMinute,
        message: 'Real-time billing started'
      });

    } catch (error) {
      console.error(`❌ Failed to start billing for call ${callId}:`, error.message);
      throw error;
    }
  }

  // Process billing for one minute
  async processMinuteBilling(callId) {
    try {
      const billingData = this.activeCalls.get(callId);
      if (!billingData || !billingData.isActive) {
        console.log(`⚠️ Billing data not found or inactive for call ${callId}`);
        return;
      }

      // Calculate current minute
      const now = new Date();
      const elapsedMinutes = Math.floor((now - billingData.startTime) / 60000);
      const currentMinute = elapsedMinutes + 1;

      // Skip if we've already billed this minute
      if (currentMinute <= billingData.lastBilledMinute) {
        return;
      }

      console.log(`🔄 Processing minute ${currentMinute} billing for call ${callId}`);

      // Check if caller has sufficient balance
      const callerWallet = await Coin.findOne({ userId: billingData.callerId });
      if (!callerWallet) {
        console.log(`❌ Caller wallet not found for call ${callId}`);
        await this.stopBilling(callId, 'insufficient_balance');
        return;
      }

      if (callerWallet.balance < this.coinsPerMinute) {
        console.log(`❌ Insufficient balance for call ${callId}. Balance: ${callerWallet.balance}, Required: ${this.coinsPerMinute}`);
        await this.stopBilling(callId, 'insufficient_balance');
        return;
      }

      // Deduct coins from caller
      const balanceBefore = callerWallet.balance;
      const balanceAfter = balanceBefore - this.coinsPerMinute;
      
      callerWallet.balance = balanceAfter;
      callerWallet.totalSpent += this.coinsPerMinute;
      callerWallet.lastUpdated = new Date();
      await callerWallet.save();

      // Calculate commission for streamer
      const commissionEarned = Math.floor(this.coinsPerMinute * (this.commissionPercentage / 100));
      
      // Add commission to streamer
      const streamerWallet = await Coin.findOne({ userId: billingData.receiverId });
      if (streamerWallet) {
        const streamerBalanceBefore = streamerWallet.balance;
        const streamerBalanceAfter = streamerBalanceBefore + commissionEarned;
        
        streamerWallet.balance = streamerBalanceAfter;
        streamerWallet.totalEarned += commissionEarned;
        streamerWallet.lastUpdated = new Date();
        await streamerWallet.save();

        // Emit commission earned event
        this.io.to(billingData.receiverId.toString()).emit('commission:earned', {
          callId,
          amount: commissionEarned,
          newBalance: streamerBalanceAfter,
          minute: currentMinute
        });
      }

      // Create transaction records
      const deductionTransaction = new Transaction({
        userId: billingData.callerId,
        type: 'deduction',
        amount: -this.coinsPerMinute,
        balanceBefore,
        balanceAfter,
        description: `Real-time call deduction: minute ${currentMinute}`,
        callId: callId,
        callDuration: currentMinute,
        status: 'completed'
      });
      await deductionTransaction.save();

      if (commissionEarned > 0) {
        const commissionTransaction = new Transaction({
          userId: billingData.receiverId,
          type: 'commission',
          amount: commissionEarned,
          balanceBefore: streamerWallet.balance - commissionEarned,
          balanceAfter: streamerWallet.balance,
          description: `Real-time commission: minute ${currentMinute}`,
          callId: callId,
          callDuration: currentMinute,
          streamerId: billingData.receiverId,
          commissionRate: this.commissionPercentage,
          status: 'completed'
        });
        await commissionTransaction.save();
      }

      // Update billing data
      billingData.lastBilledMinute = currentMinute;
      billingData.totalCoinsDeducted += this.coinsPerMinute;
      billingData.totalCommissionEarned += commissionEarned;

      // Update call record
      const call = await Call.findById(callId);
      if (call) {
        call.totalCoinsDeducted = billingData.totalCoinsDeducted;
        call.commissionEarned = billingData.totalCommissionEarned;
        call.lastMinuteBilled = currentMinute;
        await call.save();
      }

      // Emit real-time balance updates
      this.io.to(billingData.callerId.toString()).emit('coins:deducted', {
        callId,
        amount: this.coinsPerMinute,
        newBalance: balanceAfter,
        minute: currentMinute,
        totalDeducted: billingData.totalCoinsDeducted
      });

      console.log(`✅ Billed minute ${currentMinute} for call ${callId}: ${this.coinsPerMinute} coins deducted, ${commissionEarned} commission earned`);

    } catch (error) {
      console.error(`❌ Error processing minute billing for call ${callId}:`, error.message);
      
      // Emit error event
      this.io.to(billingData.callerId.toString()).emit('billing:error', {
        callId,
        error: 'Billing processing failed',
        message: error.message
      });
    }
  }

  // Stop billing for a call
  async stopBilling(callId, reason = 'call_ended') {
    try {
      const billingData = this.activeCalls.get(callId);
      if (!billingData) {
        console.log(`⚠️ No active billing found for call ${callId}`);
        return;
      }

      // Clear interval
      const interval = this.billingIntervals.get(callId);
      if (interval) {
        clearInterval(interval);
        this.billingIntervals.delete(callId);
      }

      // Mark billing as inactive
      billingData.isActive = false;
      this.activeCalls.delete(callId);

      console.log(`✅ Stopped billing for call ${callId}. Reason: ${reason}`);

      // Emit billing stopped event
      this.io.to(billingData.callerId.toString()).emit('billing:stopped', {
        callId,
        reason,
        totalCoinsDeducted: billingData.totalCoinsDeducted,
        totalCommissionEarned: billingData.totalCommissionEarned
      });

      this.io.to(billingData.receiverId.toString()).emit('billing:stopped', {
        callId,
        reason,
        totalCoinsDeducted: billingData.totalCoinsDeducted,
        totalCommissionEarned: billingData.totalCommissionEarned
      });

      // If call ended due to insufficient balance, end the call
      if (reason === 'insufficient_balance') {
        const call = await Call.findById(callId);
        if (call && call.status === 'ongoing') {
          call.status = 'ended';
          call.endTime = new Date();
          call.endReason = 'insufficient_balance';
          call.isActive = false;
          await call.save();

          // Emit call ended event
          this.io.to(call.callerId.toString()).emit('call:ended', {
            callId,
            reason: 'insufficient_balance',
            message: 'Call ended due to insufficient balance'
          });

          this.io.to(call.receiverId.toString()).emit('call:ended', {
            callId,
            reason: 'insufficient_balance',
            message: 'Call ended due to insufficient balance'
          });
        }
      }

    } catch (error) {
      console.error(`❌ Error stopping billing for call ${callId}:`, error.message);
    }
  }

  // Get billing status for a call
  getBillingStatus(callId) {
    const billingData = this.activeCalls.get(callId);
    if (!billingData) {
      return null;
    }

    return {
      callId,
      isActive: billingData.isActive,
      startTime: billingData.startTime,
      lastBilledMinute: billingData.lastBilledMinute,
      totalCoinsDeducted: billingData.totalCoinsDeducted,
      totalCommissionEarned: billingData.totalCommissionEarned,
      coinsPerMinute: this.coinsPerMinute,
      commissionPercentage: this.commissionPercentage
    };
  }

  // Get all active billing sessions
  getAllActiveBilling() {
    const activeBilling = [];
    for (const [callId, billingData] of this.activeCalls) {
      activeBilling.push(this.getBillingStatus(callId));
    }
    return activeBilling;
  }

  // Cleanup inactive billing sessions
  async cleanupInactiveBilling() {
    try {
      const now = new Date();
      const inactiveThreshold = 5 * 60 * 1000; // 5 minutes

      for (const [callId, billingData] of this.activeCalls) {
        const timeSinceLastActivity = now - billingData.startTime;
        
        if (timeSinceLastActivity > inactiveThreshold) {
          console.log(`🧹 Cleaning up inactive billing for call ${callId}`);
          await this.stopBilling(callId, 'timeout');
        }
      }
    } catch (error) {
      console.error('❌ Error cleaning up inactive billing:', error.message);
    }
  }

  // Start cleanup interval (run every 5 minutes)
  startCleanupInterval() {
    setInterval(() => {
      this.cleanupInactiveBilling();
    }, 5 * 60 * 1000);
    
    console.log('✅ Started billing cleanup interval');
  }
}

module.exports = RealTimeBillingService;
