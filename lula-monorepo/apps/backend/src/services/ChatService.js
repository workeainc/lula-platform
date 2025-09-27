const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');
const NotificationService = require('./NotificationService');

class ChatService {
  constructor(io = null) {
    this.io = io;
  }

  /**
   * Create a new chat between users
   * @param {string} userId - User ID
   * @param {string} streamerId - Streamer ID
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Created chat
   */
  async createChat(userId, streamerId, options = {}) {
    try {
      // Check if chat already exists
      const existingChat = await Chat.findOne({
        'participants.userId': { $all: [userId, streamerId] },
        status: 'active'
      });

      if (existingChat) {
        return {
          error: false,
          chat: existingChat,
          isNew: false
        };
      }

      // Verify users exist
      const [user, streamer] = await Promise.all([
        User.findById(userId),
        User.findById(streamerId)
      ]);

      if (!user || !streamer) {
        throw new Error('One or both users not found');
      }

      // Create new chat
      const chat = new Chat({
        participants: [
          {
            userId: user._id,
            role: user.role,
            joinedAt: new Date(),
            lastSeen: new Date()
          },
          {
            userId: streamer._id,
            role: streamer.role,
            joinedAt: new Date(),
            lastSeen: new Date()
          }
        ],
        chatType: 'user_streamer',
        createdBy: userId,
        relatedCallId: options.relatedCallId || null,
        streamChannelId: options.streamChannelId || null,
        settings: {
          allowNotifications: true,
          autoDelete: false,
          deleteAfterDays: 30
        },
        stats: {
          totalMessages: 0,
          unreadCount: new Map()
        }
      });

      await chat.save();

      // Create system message
      await this.createSystemMessage(chat._id, 'chat_created', {
        createdBy: userId,
        participants: [userId, streamerId]
      });

      return {
        error: false,
        chat,
        isNew: true
      };

    } catch (error) {
      console.error('Create chat error:', error);
      return {
        error: true,
        message: error.message || 'Failed to create chat'
      };
    }
  }

  /**
   * Send a message
   * @param {string} chatId - Chat ID
   * @param {string} senderId - Sender ID
   * @param {Object} messageData - Message data
   * @returns {Promise<Object>} - Sent message
   */
  async sendMessage(chatId, senderId, messageData) {
    try {
      // Verify chat exists and user is participant
      const chat = await Chat.findById(chatId);
      if (!chat) {
        throw new Error('Chat not found');
      }

      const participant = chat.participants.find(p => p.userId.toString() === senderId.toString());
      if (!participant) {
        throw new Error('User is not a participant in this chat');
      }

      // Create message
      const message = new Message({
        chatId,
        senderId,
        senderRole: participant.role,
        content: messageData.content,
        messageType: messageData.messageType || 'text',
        attachments: messageData.attachments || [],
        metadata: {
          replyTo: messageData.replyTo || null,
          forwardedFrom: messageData.forwardedFrom || null
        }
      });

      await message.save();

      // Update chat with last message
      chat.lastMessage = {
        content: message.content,
        senderId: message.senderId,
        senderRole: message.senderRole,
        timestamp: message.createdAt,
        messageType: message.messageType
      };

      // Increment total messages
      chat.stats.totalMessages += 1;

      // Increment unread count for other participants
      chat.participants.forEach(participant => {
        if (participant.userId.toString() !== senderId.toString()) {
          const currentCount = chat.stats.unreadCount.get(participant.userId.toString()) || 0;
          chat.stats.unreadCount.set(participant.userId.toString(), currentCount + 1);
        }
      });

      await chat.save();

      // Emit real-time message to WebSocket clients
      if (this.io) {
        this.io.to(`chat-${chatId}`).emit('new-message', {
          message: await message.populate('senderId', 'name profileImage'),
          chatId
        });

        // Notify other participants
        chat.participants.forEach(participant => {
          if (participant.userId.toString() !== senderId.toString()) {
            this.io.to(`user-${participant.userId}`).emit('chat-notification', {
              chatId,
              message: message.content,
              sender: participant.role,
              unreadCount: chat.stats.unreadCount.get(participant.userId.toString()) || 0
            });
          }
        });
      }

      // Send push notifications to other participants
      try {
        const notificationService = new NotificationService();
        for (const participant of chat.participants) {
          if (participant.userId.toString() !== senderId.toString()) {
            await notificationService.sendMessageNotification(
              participant.userId.toString(),
              senderId,
              message.content,
              chatId
            );
          }
        }
        console.log(`✅ Message notifications sent for chat: ${chatId}`);
      } catch (error) {
        console.warn('⚠️ Failed to send message notifications:', error.message);
      }

      return {
        error: false,
        message: await message.populate('senderId', 'name profileImage')
      };

    } catch (error) {
      console.error('Send message error:', error);
      return {
        error: true,
        message: error.message || 'Failed to send message'
      };
    }
  }

  /**
   * Get chat messages with pagination
   * @param {string} chatId - Chat ID
   * @param {string} userId - User ID
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>} - Messages
   */
  async getMessages(chatId, userId, options = {}) {
    try {
      const { page = 1, limit = 50 } = options;

      // Verify user is participant
      const chat = await Chat.findById(chatId);
      if (!chat) {
        throw new Error('Chat not found');
      }

      const participant = chat.participants.find(p => p.userId.toString() === userId.toString());
      if (!participant) {
        throw new Error('User is not a participant in this chat');
      }

      // Get messages
      const messages = await Message.find({
        chatId,
        'flags.isDeleted': false
      })
      .populate('senderId', 'name profileImage')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

      // Mark messages as read
      await this.markMessagesAsRead(chatId, userId);

      return {
        error: false,
        messages: messages.reverse(), // Reverse to show oldest first
        pagination: {
          page,
          limit,
          hasMore: messages.length === limit
        }
      };

    } catch (error) {
      console.error('Get messages error:', error);
      return {
        error: true,
        message: error.message || 'Failed to get messages'
      };
    }
  }

  /**
   * Get user's chat list
   * @param {string} userId - User ID
   * @param {Object} options - Options
   * @returns {Promise<Object>} - Chat list
   */
  async getChatList(userId, options = {}) {
    try {
      const { page = 1, limit = 20, role } = options;

      const query = {
        'participants.userId': userId,
        status: 'active'
      };

      if (role) {
        query['participants.role'] = role;
      }

      const skip = (page - 1) * limit;

      const chats = await Chat.find(query)
        .populate('participants.userId', 'name profileImage role')
        .populate('lastMessage.senderId', 'name profileImage')
        .sort({ 'lastMessage.timestamp': -1 })
        .skip(skip)
        .limit(limit);

      // Add unread count for each chat
      const chatsWithUnread = await Promise.all(
        chats.map(async (chat) => {
          const unreadCount = chat.stats.unreadCount.get(userId.toString()) || 0;
          return {
            ...chat.toObject(),
            unreadCount
          };
        })
      );

      return {
        error: false,
        chats: chatsWithUnread,
        pagination: {
          page,
          limit,
          hasMore: chats.length === limit
        }
      };

    } catch (error) {
      console.error('Get chat list error:', error);
      return {
        error: true,
        message: error.message || 'Failed to get chat list'
      };
    }
  }

  /**
   * Mark messages as read
   * @param {string} chatId - Chat ID
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async markMessagesAsRead(chatId, userId) {
    try {
      const messages = await Message.find({
        chatId,
        senderId: { $ne: userId },
        'readBy.userId': { $ne: userId },
        'flags.isDeleted': false
      });

      await Promise.all(
        messages.map(message => message.markAsRead(userId))
      );

      // Reset unread count in chat
      const chat = await Chat.findById(chatId);
      if (chat) {
        await chat.resetUnreadCount(userId);
        await chat.updateLastSeen(userId);
      }

    } catch (error) {
      console.error('Mark messages as read error:', error);
    }
  }

  /**
   * Create system message
   * @param {string} chatId - Chat ID
   * @param {string} type - System message type
   * @param {Object} data - System data
   * @returns {Promise<Object>} - System message
   */
  async createSystemMessage(chatId, type, data) {
    try {
      const message = new Message({
        chatId,
        senderId: null, // System message
        senderRole: 'SYSTEM',
        content: this.getSystemMessageContent(type, data),
        messageType: 'system',
        systemData: {
          type,
          data
        }
      });

      await message.save();

      return {
        error: false,
        message
      };

    } catch (error) {
      console.error('Create system message error:', error);
      return {
        error: true,
        message: error.message || 'Failed to create system message'
      };
    }
  }

  /**
   * Get system message content
   * @param {string} type - Message type
   * @param {Object} data - Data
   * @returns {string} - Message content
   */
  getSystemMessageContent(type, data) {
    switch (type) {
      case 'chat_created':
        return 'Chat started';
      case 'user_joined':
        return 'User joined the chat';
      case 'user_left':
        return 'User left the chat';
      case 'call_started':
        return 'Call started';
      case 'call_ended':
        return 'Call ended';
      case 'payment_sent':
        return 'Payment sent';
      case 'payment_received':
        return 'Payment received';
      default:
        return 'System message';
    }
  }

  /**
   * Delete chat
   * @param {string} chatId - Chat ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Result
   */
  async deleteChat(chatId, userId) {
    try {
      const chat = await Chat.findById(chatId);
      if (!chat) {
        throw new Error('Chat not found');
      }

      const participant = chat.participants.find(p => p.userId.toString() === userId.toString());
      if (!participant) {
        throw new Error('User is not a participant in this chat');
      }

      // Soft delete - mark as deleted
      chat.status = 'deleted';
      await chat.save();

      return {
        error: false,
        message: 'Chat deleted successfully'
      };

    } catch (error) {
      console.error('Delete chat error:', error);
      return {
        error: true,
        message: error.message || 'Failed to delete chat'
      };
    }
  }

  /**
   * Get chat by ID
   * @param {string} chatId - Chat ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Chat
   */
  async getChatById(chatId, userId) {
    try {
      const chat = await Chat.findById(chatId)
        .populate('participants.userId', 'name profileImage role')
        .populate('lastMessage.senderId', 'name profileImage');

      if (!chat) {
        throw new Error('Chat not found');
      }

      const participant = chat.participants.find(p => p.userId.toString() === userId.toString());
      if (!participant) {
        throw new Error('User is not a participant in this chat');
      }

      return {
        error: false,
        chat
      };

    } catch (error) {
      console.error('Get chat by ID error:', error);
      return {
        error: true,
        message: error.message || 'Failed to get chat'
      };
    }
  }
}

module.exports = ChatService;
