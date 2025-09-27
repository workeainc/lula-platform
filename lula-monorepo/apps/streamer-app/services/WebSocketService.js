import BackendService from './BackendService';
import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  // Connect to WebSocket server
  connect(userId) {
    try {
      const wsUrl = BackendService.getWebSocketUrl();
      this.socket = io(wsUrl, {
        transports: ['websocket'],
        timeout: 10000,
        forceNew: true
      });

      this.socket.on('connect', () => {
        console.log('🔌 WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Join user room
        this.socket.emit('join-user-room', userId);
        
        // Emit connection event
        this.emit('connection', { status: 'connected', userId });
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 WebSocket disconnected:', reason);
        this.isConnected = false;
        this.emit('connection', { status: 'disconnected', reason });
        
        // Attempt to reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          setTimeout(() => {
            console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            this.connect(userId);
          }, 2000 * this.reconnectAttempts);
        }
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ WebSocket connection error:', error);
        this.isConnected = false;
        this.emit('connection', { status: 'error', error: error.message });
      });

      // Set up event listeners
      this.setupEventListeners();

    } catch (error) {
      console.error('❌ WebSocket setup error:', error);
      this.emit('connection', { status: 'error', error: error.message });
    }
  }

  // Set up event listeners
  setupEventListeners() {
    // Incoming call
    this.socket.on('incoming-call', (data) => {
      console.log('📞 Incoming call:', data);
      this.emit('incoming-call', data);
    });

    // Call accepted
    this.socket.on('call-accepted', (data) => {
      console.log('✅ Call accepted:', data);
      this.emit('call-accepted', data);
    });

    // Call rejected
    this.socket.on('call-rejected', (data) => {
      console.log('❌ Call rejected:', data);
      this.emit('call-rejected', data);
    });

    // Call ended
    this.socket.on('call-ended', (data) => {
      console.log('📞 Call ended:', data);
      this.emit('call-ended', data);
    });

    // Balance updated
    this.socket.on('balance-updated', (data) => {
      console.log('💰 Balance updated:', data);
      this.emit('balance-updated', data);
    });

    // Commission updated
    this.socket.on('commission-updated', (data) => {
      console.log('💎 Commission updated:', data);
      this.emit('commission-updated', data);
    });
  }

  // Emit events to listeners
  emit(event, data) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  // Add event listener
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  // Remove event listener
  off(event, callback) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Emit call events
  emitCallInitiated(callerId, receiverId, callType) {
    if (this.isConnected) {
      this.socket.emit('call-initiated', {
        callerId,
        receiverId,
        callType
      });
    }
  }

  emitCallAccepted(callerId, receiverId, callId) {
    if (this.isConnected) {
      this.socket.emit('call-accepted', {
        callerId,
        receiverId,
        callId
      });
    }
  }

  emitCallRejected(callerId, reason) {
    if (this.isConnected) {
      this.socket.emit('call-rejected', {
        callerId,
        reason
      });
    }
  }

  emitCallEnded(callerId, receiverId, duration, coinsDeducted, commissionEarned) {
    if (this.isConnected) {
      this.socket.emit('call-ended', {
        callerId,
        receiverId,
        duration,
        coinsDeducted,
        commissionEarned
      });
    }
  }

  emitBalanceUpdated(userId, newBalance) {
    if (this.isConnected) {
      this.socket.emit('balance-updated', {
        userId,
        newBalance
      });
    }
  }

  emitCommissionUpdated(streamerId, newCommission) {
    if (this.isConnected) {
      this.socket.emit('commission-updated', {
        streamerId,
        newCommission
      });
    }
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

export default new WebSocketService();
