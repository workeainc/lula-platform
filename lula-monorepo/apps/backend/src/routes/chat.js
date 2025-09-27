const express = require('express');
const router = express.Router();
const ChatService = require('../services/ChatService');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');

// Initialize chat service
let chatService = null;

// Initialize chat service with Socket.io instance
const initializeChatService = (io) => {
  if (!chatService) {
    chatService = new ChatService(io);
    console.log('✅ Chat service initialized');
  }
  return chatService;
};

// Export function to initialize chat service
router.initializeChatService = initializeChatService;

// ==================== CHAT MANAGEMENT ====================

/**
 * @route   POST /api/chat/create
 * @desc    Create a new chat between user and streamer
 * @access  Private
 */
router.post('/create', async (req, res) => {
  try {
    const { streamerId, relatedCallId, streamChannelId } = req.body;
    const userId = req.user.id;

    if (!streamerId) {
      return res.status(400).json({
        error: true,
        message: 'Streamer ID is required'
      });
    }

    // Verify streamer exists and is a streamer
    const streamer = await User.findById(streamerId);
    if (!streamer || streamer.role !== 'STREAMER') {
      return res.status(400).json({
        error: true,
        message: 'Invalid streamer ID'
      });
    }

    // Create chat
    const result = await chatService.createChat(userId, streamerId, {
      relatedCallId,
      streamChannelId
    });

    if (result.error) {
      return res.status(400).json(result);
    }

    res.json({
      error: false,
      message: 'Chat created successfully',
      chat: result.chat,
      isNew: result.isNew
    });

  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to create chat'
    });
  }
});

/**
 * @route   GET /api/chat/list
 * @desc    Get user's chat list
 * @access  Private
 */
router.get('/list', async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, role } = req.query;

    const result = await chatService.getChatList(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      role
    });

    if (result.error) {
      return res.status(400).json(result);
    }

    res.json({
      error: false,
      message: 'Chat list retrieved successfully',
      chats: result.chats,
      pagination: result.pagination
    });

  } catch (error) {
    console.error('Get chat list error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to get chat list'
    });
  }
});

/**
 * @route   GET /api/chat/:chatId
 * @desc    Get chat by ID
 * @access  Private
 */
router.get('/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    const result = await chatService.getChatById(chatId, userId);

    if (result.error) {
      return res.status(400).json(result);
    }

    res.json({
      error: false,
      message: 'Chat retrieved successfully',
      chat: result.chat
    });

  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to get chat'
    });
  }
});

/**
 * @route   DELETE /api/chat/:chatId
 * @desc    Delete a chat
 * @access  Private
 */
router.delete('/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    const result = await chatService.deleteChat(chatId, userId);

    if (result.error) {
      return res.status(400).json(result);
    }

    res.json({
      error: false,
      message: 'Chat deleted successfully'
    });

  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to delete chat'
    });
  }
});

// ==================== MESSAGE MANAGEMENT ====================

/**
 * @route   POST /api/chat/:chatId/message
 * @desc    Send a message in a chat
 * @access  Private
 */
router.post('/:chatId/message', async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;
    const { content, messageType = 'text', attachments = [], replyTo, forwardedFrom } = req.body;

    if (!content && (!attachments || attachments.length === 0)) {
      return res.status(400).json({
        error: true,
        message: 'Message content or attachments are required'
      });
    }

    const result = await chatService.sendMessage(chatId, userId, {
      content,
      messageType,
      attachments,
      replyTo,
      forwardedFrom
    });

    if (result.error) {
      return res.status(400).json(result);
    }

    res.json({
      error: false,
      message: 'Message sent successfully',
      messageData: result.message
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to send message'
    });
  }
});

/**
 * @route   GET /api/chat/:chatId/messages
 * @desc    Get messages from a chat
 * @access  Private
 */
router.get('/:chatId/messages', async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;
    const { page = 1, limit = 50 } = req.query;

    const result = await chatService.getMessages(chatId, userId, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    if (result.error) {
      return res.status(400).json(result);
    }

    res.json({
      error: false,
      message: 'Messages retrieved successfully',
      messages: result.messages,
      pagination: result.pagination
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to get messages'
    });
  }
});

/**
 * @route   PUT /api/chat/:chatId/messages/read
 * @desc    Mark messages as read
 * @access  Private
 */
router.put('/:chatId/messages/read', async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    await chatService.markMessagesAsRead(chatId, userId);

    res.json({
      error: false,
      message: 'Messages marked as read'
    });

  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to mark messages as read'
    });
  }
});

// ==================== MESSAGE ACTIONS ====================

/**
 * @route   PUT /api/chat/message/:messageId/edit
 * @desc    Edit a message
 * @access  Private
 */
router.put('/message/:messageId/edit', async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        error: true,
        message: 'Content is required'
      });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        error: true,
        message: 'Message not found'
      });
    }

    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({
        error: true,
        message: 'You can only edit your own messages'
      });
    }

    await message.editMessage(content, userId);

    res.json({
      error: false,
      message: 'Message edited successfully',
      messageData: message
    });

  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to edit message'
    });
  }
});

/**
 * @route   DELETE /api/chat/message/:messageId
 * @desc    Delete a message
 * @access  Private
 */
router.delete('/message/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        error: true,
        message: 'Message not found'
      });
    }

    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({
        error: true,
        message: 'You can only delete your own messages'
      });
    }

    await message.deleteMessage(userId);

    res.json({
      error: false,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to delete message'
    });
  }
});

/**
 * @route   POST /api/chat/message/:messageId/reaction
 * @desc    Add reaction to a message
 * @access  Private
 */
router.post('/message/:messageId/reaction', async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({
        error: true,
        message: 'Emoji is required'
      });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        error: true,
        message: 'Message not found'
      });
    }

    await message.addReaction(userId, emoji);

    res.json({
      error: false,
      message: 'Reaction added successfully',
      messageData: message
    });

  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to add reaction'
    });
  }
});

/**
 * @route   DELETE /api/chat/message/:messageId/reaction
 * @desc    Remove reaction from a message
 * @access  Private
 */
router.delete('/message/:messageId/reaction', async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        error: true,
        message: 'Message not found'
      });
    }

    await message.removeReaction(userId);

    res.json({
      error: false,
      message: 'Reaction removed successfully',
      messageData: message
    });

  } catch (error) {
    console.error('Remove reaction error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to remove reaction'
    });
  }
});

// ==================== CHAT STATISTICS ====================

/**
 * @route   GET /api/chat/:chatId/stats
 * @desc    Get chat statistics
 * @access  Private
 */
router.get('/:chatId/stats', async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    // Verify user is participant
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        error: true,
        message: 'Chat not found'
      });
    }

    const participant = chat.participants.find(p => p.userId.toString() === userId.toString());
    if (!participant) {
      return res.status(403).json({
        error: true,
        message: 'User is not a participant in this chat'
      });
    }

    // Get message statistics
    const totalMessages = await Message.countDocuments({
      chatId,
      'flags.isDeleted': false
    });

    const unreadCount = await Message.getUnreadCount(chatId, userId);

    const messagesByType = await Message.aggregate([
      { $match: { chatId, 'flags.isDeleted': false } },
      { $group: { _id: '$messageType', count: { $sum: 1 } } }
    ]);

    res.json({
      error: false,
      message: 'Chat statistics retrieved successfully',
      stats: {
        totalMessages,
        unreadCount,
        messagesByType,
        chatStats: chat.stats
      }
    });

  } catch (error) {
    console.error('Get chat stats error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to get chat statistics'
    });
  }
});

module.exports = router;
