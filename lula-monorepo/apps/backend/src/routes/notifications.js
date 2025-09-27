const express = require('express');
const router = express.Router();
const NotificationService = require('../services/NotificationService');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Initialize notification service
let notificationService = null;

// Initialize notification service
const initializeNotificationService = (io) => {
  if (!notificationService) {
    notificationService = new NotificationService();
    
    // Add Socket.io instance for in-app notifications
    notificationService.sendInAppNotification = async (userId, notification) => {
      if (io) {
        io.to(`user-${userId}`).emit('notification', {
          id: notification._id,
          title: notification.title,
          body: notification.body,
          type: notification.type,
          data: notification.data,
          createdAt: notification.createdAt
        });
      }
    };
    
    console.log('✅ Notification service initialized');
  }
  return notificationService;
};

// Export function to initialize notification service
router.initializeNotificationService = initializeNotificationService;

// ==================== NOTIFICATION MANAGEMENT ====================

/**
 * @route   GET /api/notifications
 * @desc    Get user's notifications
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, type, status, unreadOnly } = req.query;

    const result = await notificationService.getUserNotifications(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      type,
      status,
      unreadOnly: unreadOnly === 'true'
    });

    if (result.error) {
      return res.status(400).json(result);
    }

    res.json({
      error: false,
      message: 'Notifications retrieved successfully',
      notifications: result.notifications,
      unreadCount: result.unreadCount,
      pagination: result.pagination
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to get notifications'
    });
  }
});

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count
 * @access  Private
 */
router.get('/unread-count', async (req, res) => {
  try {
    const userId = req.user.id;
    const unreadCount = await Notification.getUnreadCount(userId);

    res.json({
      error: false,
      message: 'Unread count retrieved successfully',
      unreadCount
    });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to get unread count'
    });
  }
});

/**
 * @route   PUT /api/notifications/:notificationId/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.put('/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const result = await notificationService.markAsRead(notificationId, userId);

    if (result.error) {
      return res.status(400).json(result);
    }

    res.json({
      error: false,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to mark notification as read'
    });
  }
});

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put('/read-all', async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await notificationService.markAllAsRead(userId);

    if (result.error) {
      return res.status(400).json(result);
    }

    res.json({
      error: false,
      message: 'All notifications marked as read'
    });

  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to mark all notifications as read'
    });
  }
});

/**
 * @route   DELETE /api/notifications/:notificationId
 * @desc    Delete notification
 * @access  Private
 */
router.delete('/:notificationId', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipientId: userId
    });

    if (!notification) {
      return res.status(404).json({
        error: true,
        message: 'Notification not found'
      });
    }

    res.json({
      error: false,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to delete notification'
    });
  }
});

// ==================== NOTIFICATION SENDING ====================

/**
 * @route   POST /api/notifications/send
 * @desc    Send notification to user
 * @access  Private (Admin only)
 */
router.post('/send', async (req, res) => {
  try {
    const { recipientId, title, body, type, data, priority, channels, actions } = req.body;

    if (!recipientId || !title || !body || !type) {
      return res.status(400).json({
        error: true,
        message: 'Recipient ID, title, body, and type are required'
      });
    }

    const result = await notificationService.sendNotification(recipientId, {
      title,
      body,
      type,
      data,
      priority,
      channels,
      actions
    });

    if (result.error) {
      return res.status(400).json(result);
    }

    res.json({
      error: false,
      message: 'Notification sent successfully',
      notificationId: result.results.notificationId
    });

  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to send notification'
    });
  }
});

/**
 * @route   POST /api/notifications/send-call
 * @desc    Send call notification
 * @access  Private
 */
router.post('/send-call', async (req, res) => {
  try {
    const { recipientId, callType, callId } = req.body;
    const callerId = req.user.id;

    if (!recipientId || !callType || !callId) {
      return res.status(400).json({
        error: true,
        message: 'Recipient ID, call type, and call ID are required'
      });
    }

    const result = await notificationService.sendCallNotification(
      recipientId,
      callerId,
      callType,
      callId
    );

    if (result.error) {
      return res.status(400).json(result);
    }

    res.json({
      error: false,
      message: 'Call notification sent successfully',
      notificationId: result.results.notificationId
    });

  } catch (error) {
    console.error('Send call notification error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to send call notification'
    });
  }
});

/**
 * @route   POST /api/notifications/send-message
 * @desc    Send message notification
 * @access  Private
 */
router.post('/send-message', async (req, res) => {
  try {
    const { recipientId, messageContent, chatId } = req.body;
    const senderId = req.user.id;

    if (!recipientId || !messageContent || !chatId) {
      return res.status(400).json({
        error: true,
        message: 'Recipient ID, message content, and chat ID are required'
      });
    }

    const result = await notificationService.sendMessageNotification(
      recipientId,
      senderId,
      messageContent,
      chatId
    );

    if (result.error) {
      return res.status(400).json(result);
    }

    res.json({
      error: false,
      message: 'Message notification sent successfully',
      notificationId: result.results.notificationId
    });

  } catch (error) {
    console.error('Send message notification error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to send message notification'
    });
  }
});

// ==================== TOKEN MANAGEMENT ====================

/**
 * @route   POST /api/notifications/token/fcm
 * @desc    Update FCM token
 * @access  Private
 */
router.post('/token/fcm', async (req, res) => {
  try {
    const userId = req.user.id;
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({
        error: true,
        message: 'FCM token is required'
      });
    }

    await User.findByIdAndUpdate(userId, {
      fcmToken,
      fcmTokenUpdatedAt: new Date()
    });

    res.json({
      error: false,
      message: 'FCM token updated successfully'
    });

  } catch (error) {
    console.error('Update FCM token error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to update FCM token'
    });
  }
});

/**
 * @route   POST /api/notifications/token/expo
 * @desc    Update Expo push token
 * @access  Private
 */
router.post('/token/expo', async (req, res) => {
  try {
    const userId = req.user.id;
    const { expoPushToken } = req.body;

    if (!expoPushToken) {
      return res.status(400).json({
        error: true,
        message: 'Expo push token is required'
      });
    }

    await User.findByIdAndUpdate(userId, {
      expoPushToken,
      expoTokenUpdatedAt: new Date()
    });

    res.json({
      error: false,
      message: 'Expo push token updated successfully'
    });

  } catch (error) {
    console.error('Update Expo token error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to update Expo push token'
    });
  }
});

/**
 * @route   DELETE /api/notifications/token/fcm
 * @desc    Remove FCM token
 * @access  Private
 */
router.delete('/token/fcm', async (req, res) => {
  try {
    const userId = req.user.id;

    await User.findByIdAndUpdate(userId, {
      $unset: { fcmToken: 1, fcmTokenUpdatedAt: 1 }
    });

    res.json({
      error: false,
      message: 'FCM token removed successfully'
    });

  } catch (error) {
    console.error('Remove FCM token error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to remove FCM token'
    });
  }
});

/**
 * @route   DELETE /api/notifications/token/expo
 * @desc    Remove Expo push token
 * @access  Private
 */
router.delete('/token/expo', async (req, res) => {
  try {
    const userId = req.user.id;

    await User.findByIdAndUpdate(userId, {
      $unset: { expoPushToken: 1, expoTokenUpdatedAt: 1 }
    });

    res.json({
      error: false,
      message: 'Expo push token removed successfully'
    });

  } catch (error) {
    console.error('Remove Expo token error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to remove Expo push token'
    });
  }
});

// ==================== NOTIFICATION STATISTICS ====================

/**
 * @route   GET /api/notifications/stats
 * @desc    Get notification statistics
 * @access  Private
 */
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await Notification.aggregate([
      { $match: { recipientId: userId } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          unreadCount: {
            $sum: { $cond: [{ $ne: ['$status', 'read'] }, 1, 0] }
          }
        }
      }
    ]);

    const totalNotifications = await Notification.countDocuments({ recipientId: userId });
    const unreadCount = await Notification.getUnreadCount(userId);

    res.json({
      error: false,
      message: 'Notification statistics retrieved successfully',
      stats: {
        totalNotifications,
        unreadCount,
        byType: stats
      }
    });

  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to get notification statistics'
    });
  }
});

// ==================== ADMIN NOTIFICATIONS ====================

/**
 * @route   POST /api/notifications/admin/broadcast
 * @desc    Send broadcast notification to all users
 * @access  Private (Admin only)
 */
router.post('/admin/broadcast', async (req, res) => {
  try {
    const { title, body, type = 'system_announcement', data, priority = 'normal' } = req.body;

    if (!title || !body) {
      return res.status(400).json({
        error: true,
        message: 'Title and body are required'
      });
    }

    // Get all users
    const users = await User.find({}, '_id role');
    const results = [];

    // Send notification to each user
    for (const user of users) {
      try {
        const result = await notificationService.sendNotification(user._id.toString(), {
          title,
          body,
          type,
          data,
          priority,
          channels: { push: true, inApp: true }
        });
        results.push({ userId: user._id, result });
      } catch (error) {
        results.push({ userId: user._id, error: error.message });
      }
    }

    res.json({
      error: false,
      message: 'Broadcast notification sent successfully',
      results,
      totalSent: results.length
    });

  } catch (error) {
    console.error('Broadcast notification error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to send broadcast notification'
    });
  }
});

module.exports = router;
