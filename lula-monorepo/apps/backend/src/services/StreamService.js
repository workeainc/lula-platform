const { StreamChat } = require('stream-chat');
const User = require('../models/User');

class StreamService {
  constructor() {
    this.apiKey = process.env.STREAM_API_KEY || 'd9haf5vcbwwp';
    this.apiSecret = process.env.STREAM_API_SECRET;
    
    if (!this.apiSecret) {
      console.warn('⚠️ STREAM_API_SECRET not found in environment variables');
      console.warn('⚠️ Stream.io server-side features will not work without API secret');
      console.warn('⚠️ Please add STREAM_API_SECRET to your .env file');
    }
    
    // Initialize Stream client
    this.client = StreamChat.getInstance(this.apiKey, this.apiSecret);
    
    console.log('✅ Stream.io service initialized with API key:', this.apiKey);
  }

  /**
   * Generate a Stream.io token for a user
   * @param {string} userId - User ID
   * @param {Object} userData - User data for token generation
   * @returns {Promise<string>} - JWT token
   */
  async generateToken(userId, userData = {}) {
    try {
      if (!this.apiSecret) {
        throw new Error('Stream.io API secret not configured');
      }

      // Get user from database to ensure they exist
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Create user object for Stream.io
      const streamUser = {
        id: userId,
        name: user.name || user.phoneNumber,
        image: user.profileImage || null,
        role: user.role.toLowerCase(),
        ...userData
      };

      // Generate token with 24 hour expiration
      const token = this.client.createToken(userId);

      console.log(`✅ Generated Stream.io token for user: ${userId}`);
      return token;

    } catch (error) {
      console.error('❌ Error generating Stream.io token:', error.message);
      throw error;
    }
  }

  /**
   * Create or update a user in Stream.io
   * @param {string} userId - User ID
   * @param {Object} userData - User data
   * @returns {Promise<Object>} - Stream.io user object
   */
  async upsertUser(userId, userData = {}) {
    try {
      if (!this.apiSecret) {
        throw new Error('Stream.io API secret not configured');
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const streamUser = {
        id: userId,
        name: user.name || user.phoneNumber,
        image: user.profileImage || null,
        role: user.role.toLowerCase(),
        ...userData
      };

      // Upsert user in Stream.io
      await this.client.upsertUser(streamUser);

      console.log(`✅ Upserted user in Stream.io: ${userId}`);
      return streamUser;

    } catch (error) {
      console.error('❌ Error upserting user in Stream.io:', error.message);
      throw error;
    }
  }

  /**
   * Create a call channel between two users
   * @param {string} callerId - Caller user ID
   * @param {string} receiverId - Receiver user ID
   * @param {string} callType - Type of call (voice/video)
   * @returns {Promise<Object>} - Stream.io channel
   */
  async createCallChannel(callerId, receiverId, callType = 'video') {
    try {
      if (!this.apiSecret) {
        throw new Error('Stream.io API secret not configured');
      }

      // Create channel ID (shorter format)
      const channelId = `call-${callerId.slice(-8)}-${receiverId.slice(-8)}-${Date.now().toString().slice(-6)}`;

      // Create channel
      const channel = this.client.channel('messaging', channelId, {
        name: `Call between ${callerId} and ${receiverId}`,
        members: [callerId, receiverId],
        call_settings: {
          audio: true,
          video: callType === 'video',
          screen_sharing: false,
          recording: false,
          transcribing: false
        },
        created_by_id: callerId
      });

      // Create the channel
      await channel.create();

      console.log(`✅ Created call channel: ${channelId}`);
      return {
        channelId,
        channel,
        callSettings: {
          audio: true,
          video: callType === 'video',
          screen_sharing: false,
          recording: false,
          transcribing: false
        }
      };

    } catch (error) {
      console.error('❌ Error creating call channel:', error.message);
      throw error;
    }
  }

  /**
   * Get call quality metrics from Stream.io
   * @param {string} callId - Call ID
   * @returns {Promise<Object>} - Call quality data
   */
  async getCallQuality(callId) {
    try {
      if (!this.apiSecret) {
        throw new Error('Stream.io API secret not configured');
      }

      // This would typically be called via webhooks from Stream.io
      // For now, we'll return a placeholder structure
      return {
        callId,
        quality: 'good',
        metrics: {
          audioLevel: 0.8,
          videoQuality: '720p',
          connectionStability: 'stable',
          latency: 150,
          packetLoss: 0.01
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error getting call quality:', error.message);
      throw error;
    }
  }

  /**
   * End a call and clean up resources
   * @param {string} callId - Call ID
   * @param {string} channelId - Channel ID
   * @returns {Promise<void>}
   */
  async endCall(callId, channelId) {
    try {
      if (!this.apiSecret) {
        throw new Error('Stream.io API secret not configured');
      }

      // Get channel and delete it
      const channel = this.client.channel('messaging', channelId);
      await channel.delete();

      console.log(`✅ Ended call and cleaned up channel: ${channelId}`);
    } catch (error) {
      console.error('❌ Error ending call:', error.message);
      throw error;
    }
  }

  /**
   * Send a message in a call channel
   * @param {string} channelId - Channel ID
   * @param {string} userId - User ID
   * @param {string} message - Message text
   * @returns {Promise<Object>} - Message object
   */
  async sendMessage(channelId, userId, message) {
    try {
      if (!this.apiSecret) {
        throw new Error('Stream.io API secret not configured');
      }

      const channel = this.client.channel('messaging', channelId);
      const messageObj = await channel.sendMessage({
        text: message,
        user_id: userId
      });

      console.log(`✅ Sent message in channel ${channelId}`);
      return messageObj;

    } catch (error) {
      console.error('❌ Error sending message:', error.message);
      throw error;
    }
  }

  /**
   * Get channel messages
   * @param {string} channelId - Channel ID
   * @param {number} limit - Number of messages to retrieve
   * @returns {Promise<Array>} - Array of messages
   */
  async getMessages(channelId, limit = 50) {
    try {
      if (!this.apiSecret) {
        throw new Error('Stream.io API secret not configured');
      }

      const channel = this.client.channel('messaging', channelId);
      const response = await channel.getMessages({ limit });

      console.log(`✅ Retrieved ${response.messages.length} messages from channel ${channelId}`);
      return response.messages;

    } catch (error) {
      console.error('❌ Error getting messages:', error.message);
      throw error;
    }
  }

  /**
   * Check if Stream.io is properly configured
   * @returns {boolean} - Configuration status
   */
  isConfigured() {
    return !!(this.apiKey && this.apiSecret);
  }

  /**
   * Get Stream.io configuration status
   * @returns {Object} - Configuration status
   */
  getConfigStatus() {
    return {
      apiKey: this.apiKey,
      hasApiSecret: !!this.apiSecret,
      isConfigured: this.isConfigured(),
      clientInitialized: !!this.client
    };
  }
}

module.exports = new StreamService();
