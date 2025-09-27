import BackendService from './BackendService';
import CoinService from './CoinService';
import WebSocketService from './WebSocketService';

class CallService {
  constructor() {
    this.activeCalls = new Map();
    this.callTimers = new Map();
  }

  // Initiate a call with balance validation
  async initiateCall(callerId, receiverId, callType = 'voice') {
    try {
      // First check if user has sufficient balance
      const balanceCheck = await CoinService.validateCallBalance(callerId, callType);
      
      if (!balanceCheck.canMakeCall) {
        return {
          error: true,
          message: balanceCheck.message,
          insufficientBalance: true,
          currentBalance: balanceCheck.currentBalance,
          minimumRequired: balanceCheck.minimumBalance
        };
      }

      // Initiate call through backend
      const result = await BackendService.post('/call/initiate', {
        callerId,
        receiverId,
        callType
      });

      if (result.error) {
        return result;
      }

      const call = result.data.call;
      
      // Store active call
      this.activeCalls.set(call.id, {
        ...call,
        startTime: new Date(),
        coinsDeducted: 0,
        duration: 0
      });

      // Emit WebSocket event
      WebSocketService.emitCallInitiated(callerId, receiverId, callType);

      return {
        error: false,
        call,
        message: 'Call initiated successfully'
      };
    } catch (error) {
      console.error('CallService initiateCall error:', error);
      return { error: true, message: 'Failed to initiate call' };
    }
  }

  // Accept a call
  async acceptCall(callId, receiverId) {
    try {
      const result = await BackendService.post('/call/accept', {
        callId,
        receiverId
      });

      if (result.error) {
        return result;
      }

      const call = result.data.call;
      
      // Update active call
      if (this.activeCalls.has(callId)) {
        const activeCall = this.activeCalls.get(callId);
        activeCall.status = 'accepted';
        activeCall.startTime = new Date(call.startTime);
        this.activeCalls.set(callId, activeCall);
      }

      // Emit WebSocket event
      WebSocketService.emitCallAccepted(call.callerId, receiverId, callId);

      return {
        error: false,
        call,
        message: 'Call accepted successfully'
      };
    } catch (error) {
      console.error('CallService acceptCall error:', error);
      return { error: true, message: 'Failed to accept call' };
    }
  }

  // Reject a call
  async rejectCall(callId, callerId, reason = 'user_busy') {
    try {
      // Emit WebSocket event
      WebSocketService.emitCallRejected(callerId, reason);

      // Remove from active calls
      this.activeCalls.delete(callId);

      return {
        error: false,
        message: 'Call rejected successfully'
      };
    } catch (error) {
      console.error('CallService rejectCall error:', error);
      return { error: true, message: 'Failed to reject call' };
    }
  }

  // End a call
  async endCall(callId, userId, endReason = 'normal') {
    try {
      const result = await BackendService.post('/call/end', {
        callId,
        userId,
        endReason
      });

      if (result.error) {
        return result;
      }

      const callData = result.data.call;
      
      // Get active call data
      const activeCall = this.activeCalls.get(callId);
      
      // Clear timer if exists
      if (this.callTimers.has(callId)) {
        clearInterval(this.callTimers.get(callId));
        this.callTimers.delete(callId);
      }

      // Emit WebSocket event
      if (activeCall) {
        WebSocketService.emitCallEnded(
          activeCall.callerId,
          activeCall.receiverId,
          callData.duration,
          callData.coinsDeducted,
          callData.commissionEarned
        );
      }

      // Remove from active calls
      this.activeCalls.delete(callId);

      return {
        error: false,
        call: callData,
        message: 'Call ended successfully'
      };
    } catch (error) {
      console.error('CallService endCall error:', error);
      return { error: true, message: 'Failed to end call' };
    }
  }

  // Start per-minute billing for active call
  startCallBilling(callId, callerId, coinsPerMinute = 49) {
    if (this.callTimers.has(callId)) {
      return; // Timer already running
    }

    const timer = setInterval(async () => {
      try {
        const activeCall = this.activeCalls.get(callId);
        if (!activeCall || activeCall.status !== 'accepted') {
          clearInterval(timer);
          this.callTimers.delete(callId);
          return;
        }

        // Deduct coins for this minute
        const deductResult = await CoinService.deductCoins(
          callerId,
          coinsPerMinute,
          callId,
          `Call billing - minute ${Math.floor((Date.now() - activeCall.startTime) / 60000) + 1}`
        );

        if (deductResult.error) {
          console.error('Failed to deduct coins:', deductResult.message);
          // End call due to insufficient balance
          await this.endCall(callId, callerId, 'insufficient_balance');
          return;
        }

        // Update active call data
        activeCall.coinsDeducted += coinsPerMinute;
        activeCall.duration = Math.floor((Date.now() - activeCall.startTime) / 1000);
        this.activeCalls.set(callId, activeCall);

        // Emit balance update
        WebSocketService.emitBalanceUpdated(callerId, deductResult.data.balance);

        console.log(`💰 Deducted ${coinsPerMinute} coins for call ${callId}. Total deducted: ${activeCall.coinsDeducted}`);

      } catch (error) {
        console.error('Call billing error:', error);
      }
    }, 60000); // Every minute

    this.callTimers.set(callId, timer);
  }

  // Stop per-minute billing
  stopCallBilling(callId) {
    if (this.callTimers.has(callId)) {
      clearInterval(this.callTimers.get(callId));
      this.callTimers.delete(callId);
    }
  }

  // Get call history
  async getCallHistory(userId, page = 1, limit = 20) {
    try {
      const result = await BackendService.get(`/call/history/${userId}`, {
        page,
        limit
      });

      return result;
    } catch (error) {
      console.error('CallService getCallHistory error:', error);
      return { error: true, message: 'Failed to get call history' };
    }
  }

  // Get active calls
  async getActiveCalls(userId) {
    try {
      const result = await BackendService.get(`/call/active/${userId}`);
      return result;
    } catch (error) {
      console.error('CallService getActiveCalls error:', error);
      return { error: true, message: 'Failed to get active calls' };
    }
  }

  // Get call details
  getCallDetails(callId) {
    return this.activeCalls.get(callId);
  }

  // Get all active calls
  getAllActiveCalls() {
    return Array.from(this.activeCalls.values());
  }

  // Clear all active calls (for cleanup)
  clearAllActiveCalls() {
    // Clear all timers
    this.callTimers.forEach(timer => clearInterval(timer));
    this.callTimers.clear();
    
    // Clear all active calls
    this.activeCalls.clear();
  }

  // Legacy Firebase methods (for backward compatibility)
  async addCallLog(logData) {
    try {
      // This would be handled by the backend automatically
      return { error: false, data: 'log_created' };
    } catch (error) {
      console.error('CallService addCallLog error:', error);
      return { error: true, message: 'Failed to add call log' };
    }
  }

  async updateCallLog(logId, updateData) {
    try {
      // This would be handled by the backend automatically
      return { error: false, data: 'log_updated' };
    } catch (error) {
      console.error('CallService updateCallLog error:', error);
      return { error: true, message: 'Failed to update call log' };
    }
  }

  async getCallLogs(userId, limit = 50) {
    try {
      return await this.getCallHistory(userId, 1, limit);
    } catch (error) {
      console.error('CallService getCallLogs error:', error);
      return { error: true, message: 'Failed to get call logs' };
    }
  }
}

export default new CallService();
