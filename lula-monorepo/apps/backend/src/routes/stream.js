const express = require('express');
const router = express.Router();
const StreamService = require('../services/StreamService');
const authMiddleware = require('../middleware/auth');

// ==================== STREAM.IO TOKEN GENERATION ====================

/**
 * @route   POST /api/stream/token
 * @desc    Generate Stream.io token for user
 * @access  Private
 */
router.post('/token', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { userData } = req.body;

    // Generate Stream.io token
    const token = await StreamService.generateToken(userId, userData);

    res.json({
      error: false,
      message: 'Stream.io token generated successfully',
      token,
      apiKey: StreamService.apiKey,
      userId
    });

  } catch (error) {
    console.error('Generate token error:', error);
    res.status(500).json({
      error: true,
      message: error.message || 'Failed to generate Stream.io token'
    });
  }
});

/**
 * @route   POST /api/stream/generate-token
 * @desc    Generate Stream.io token for user (alternative endpoint for CallManager)
 * @access  Public (but requires valid userId in body)
 */
router.post('/generate-token', async (req, res) => {
  try {
    const { userId, userData } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: true,
        message: 'User ID is required'
      });
    }

    // Generate Stream.io token
    const token = await StreamService.generateToken(userId, userData);

    res.json({
      error: false,
      message: 'Stream.io token generated successfully',
      token,
      apiKey: StreamService.apiKey,
      userId
    });

  } catch (error) {
    console.error('Generate token error:', error);
    res.status(500).json({
      error: true,
      message: error.message || 'Failed to generate Stream.io token'
    });
  }
});

/**
 * @route   POST /api/stream/user/upsert
 * @desc    Create or update user in Stream.io
 * @access  Private
 */
router.post('/user/upsert', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { userData } = req.body;

    // Upsert user in Stream.io
    const streamUser = await StreamService.upsertUser(userId, userData);

    res.json({
      error: false,
      message: 'User upserted in Stream.io successfully',
      user: streamUser
    });

  } catch (error) {
    console.error('Upsert user error:', error);
    res.status(500).json({
      error: true,
      message: error.message || 'Failed to upsert user in Stream.io'
    });
  }
});

// ==================== CALL CHANNEL MANAGEMENT ====================

/**
 * @route   POST /api/stream/call/create
 * @desc    Create a call channel between two users
 * @access  Private
 */
router.post('/call/create', authMiddleware, async (req, res) => {
  try {
    const { receiverId, callType = 'video' } = req.body;
    const callerId = req.user.id;

    if (!receiverId) {
      return res.status(400).json({
        error: true,
        message: 'Receiver ID is required'
      });
    }

    // Create call channel
    const callChannel = await StreamService.createCallChannel(callerId, receiverId, callType);

    res.json({
      error: false,
      message: 'Call channel created successfully',
      channelId: callChannel.channelId,
      callSettings: callChannel.callSettings
    });

  } catch (error) {
    console.error('Create call channel error:', error);
    res.status(500).json({
      error: true,
      message: error.message || 'Failed to create call channel'
    });
  }
});

/**
 * @route   POST /api/stream/call/end
 * @desc    End a call and clean up resources
 * @access  Private
 */
router.post('/call/end', authMiddleware, async (req, res) => {
  try {
    const { callId, channelId } = req.body;

    if (!channelId) {
      return res.status(400).json({
        error: true,
        message: 'Channel ID is required'
      });
    }

    // End call and clean up
    await StreamService.endCall(callId, channelId);

    res.json({
      error: false,
      message: 'Call ended successfully'
    });

  } catch (error) {
    console.error('End call error:', error);
    res.status(500).json({
      error: true,
      message: error.message || 'Failed to end call'
    });
  }
});

// ==================== MESSAGING ====================

/**
 * @route   POST /api/stream/message/send
 * @desc    Send a message in a call channel
 * @access  Private
 */
router.post('/message/send', authMiddleware, async (req, res) => {
  try {
    const { channelId, message } = req.body;
    const userId = req.user.id;

    if (!channelId || !message) {
      return res.status(400).json({
        error: true,
        message: 'Channel ID and message are required'
      });
    }

    // Send message
    const messageObj = await StreamService.sendMessage(channelId, userId, message);

    res.json({
      error: false,
      message: 'Message sent successfully',
      messageData: messageObj
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      error: true,
      message: error.message || 'Failed to send message'
    });
  }
});

/**
 * @route   GET /api/stream/message/:channelId
 * @desc    Get messages from a channel
 * @access  Private
 */
router.get('/message/:channelId', authMiddleware, async (req, res) => {
  try {
    const { channelId } = req.params;
    const { limit = 50 } = req.query;

    // Get messages
    const messages = await StreamService.getMessages(channelId, parseInt(limit));

    res.json({
      error: false,
      message: 'Messages retrieved successfully',
      messages
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      error: true,
      message: error.message || 'Failed to get messages'
    });
  }
});

// ==================== CALL QUALITY MONITORING ====================

/**
 * @route   GET /api/stream/call/quality/:callId
 * @desc    Get call quality metrics
 * @access  Private
 */
router.get('/call/quality/:callId', authMiddleware, async (req, res) => {
  try {
    const { callId } = req.params;

    // Get call quality
    const quality = await StreamService.getCallQuality(callId);

    res.json({
      error: false,
      message: 'Call quality retrieved successfully',
      quality
    });

  } catch (error) {
    console.error('Get call quality error:', error);
    res.status(500).json({
      error: true,
      message: error.message || 'Failed to get call quality'
    });
  }
});

// ==================== CONFIGURATION STATUS ====================

/**
 * @route   GET /api/stream/config
 * @desc    Get Stream.io configuration status
 * @access  Private
 */
router.get('/config', authMiddleware, async (req, res) => {
  try {
    const configStatus = StreamService.getConfigStatus();

    res.json({
      error: false,
      message: 'Stream.io configuration status retrieved',
      config: configStatus
    });

  } catch (error) {
    console.error('Get config error:', error);
    res.status(500).json({
      error: true,
      message: error.message || 'Failed to get configuration status'
    });
  }
});

module.exports = router;
