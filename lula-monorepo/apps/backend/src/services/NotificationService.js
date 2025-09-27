const { Expo } = require('expo-server-sdk');
const Notification = require('../models/Notification');
const User = require('../models/User');
const cron = require('node-cron');

class NotificationService {
  constructor() {
    this.expo = new Expo();
    this.fcmInitialized = false;
    this.initializeFCM();
    this.startRetryScheduler();
    this.startCleanupScheduler();
  }

  /**
   * Initialize Firebase Cloud Messaging - DISABLED FOR EXPRESS.JS BACKEND
   */
  initializeFCM() {
    console.log('⚠️ FCM disabled - Using Express.js backend without Firebase');
    this.fcmInitialized = false;
  }

  /**
   * Start retry scheduler for failed notifications
   */
  startRetryScheduler() {
    // Run every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      try {
        await this.retryFailedNotifications();
      } catch (error) {
        console.error('❌ Retry scheduler error:', error);
      }
    });
    console.log('✅ Notification retry scheduler started');
  }

  /**
   * Start cleanup scheduler for expired notifications
   */
  startCleanupScheduler() {
    // Run daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
      try {
        await this.cleanupExpiredNotifications();
      } catch (error) {
        console.error('❌ Cleanup scheduler error:', error);
      }
    });
    console.log('✅ Notification cleanup scheduler started');
  }

  /**
   * Send notification to a user
   * @param {string} userId - User ID
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Object>} - Result
   */
  async sendNotification(userId, notificationData) {
    try {
      const {
        title,
        body,
        type,
        data = {},
        priority = 'normal',
        channels = { push: true, inApp: true },
        actions = [],
        relatedEntity = null,
        senderId = null
      } = notificationData;

      // Get user information
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Create notification record
      const notification = new Notification({
        recipientId: userId,
        recipientRole: user.role,
        title,
        body,
        type,
        data,
        priority,
        channels,
        actions,
        relatedEntity,
        senderId,
        status: 'pending'
      });

      await notification.save();

      // Send notification based on channels
      const results = {
        notificationId: notification._id,
        fcmResult: null,
        expoResult: null
      };

      if (channels.push) {
        // Send push notification
        const pushResult = await this.sendPushNotification(user, notification);
        results.fcmResult = pushResult.fcm;
        results.expoResult = pushResult.expo;
      }

      if (channels.inApp) {
        // Send in-app notification (WebSocket)
        await this.sendInAppNotification(userId, notification);
      }

      return {
        error: false,
        message: 'Notification sent successfully',
        results
      };

    } catch (error) {
      console.error('Send notification error:', error);
      return {
        error: true,
        message: error.message || 'Failed to send notification'
      };
    }
  }

  /**
   * Send push notification (FCM + Expo)
   * @param {Object} user - User object
   * @param {Object} notification - Notification object
   * @returns {Promise<Object>} - Push results
   */
  async sendPushNotification(user, notification) {
    const results = { fcm: null, expo: null };

    try {
      // Send FCM notification
      if (user.fcmToken && this.fcmInitialized) {
        results.fcm = await this.sendFCMNotification(user.fcmToken, notification);
        notification.deliveryInfo.fcmSent = true;
        notification.deliveryInfo.fcmMessageId = results.fcm?.messageId || null;
      }

      // Send Expo notification
      if (user.expoPushToken) {
        results.expo = await this.sendExpoNotification(user.expoPushToken, notification);
        notification.deliveryInfo.expoSent = true;
        notification.deliveryInfo.expoMessageId = results.expo?.messageId || null;
      }

      // Update notification status
      if (results.fcm?.success || results.expo?.success) {
        notification.status = 'sent';
        notification.deliveryInfo.sentAt = new Date();
      } else {
        notification.status = 'failed';
        notification.deliveryInfo.failureReason = 'Both FCM and Expo failed';
      }

      await notification.save();

    } catch (error) {
      console.error('Push notification error:', error);
      notification.status = 'failed';
      notification.deliveryInfo.failureReason = error.message;
      await notification.save();
    }

    return results;
  }

  /**
   * Send FCM notification
   * @param {string} fcmToken - FCM token
   * @param {Object} notification - Notification object
   * @returns {Promise<Object>} - FCM result
   */
  async sendFCMNotification(fcmToken, notification) {
    try {
      if (!this.fcmInitialized) {
        throw new Error('FCM not initialized');
      }

      const message = {
        token: fcmToken,
        notification: {
          title: notification.title,
          body: notification.body
        },
        data: {
          notificationId: notification._id.toString(),
          type: notification.type,
          ...notification.data
        },
        android: {
          priority: notification.priority === 'high' ? 'high' : 'normal',
          notification: {
            sound: notification.settings.sound,
            channelId: this.getAndroidChannelId(notification.type),
            priority: notification.priority === 'high' ? 'high' : 'normal'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: notification.settings.sound,
              badge: notification.settings.badge,
              category: notification.settings.category
            }
          }
        }
      };

      // FCM disabled - using Express.js backend without Firebase
      throw new Error('FCM not available - using Express.js backend');
      
      return {
        success: false,
        messageId: null,
        platform: 'fcm'
      };

    } catch (error) {
      console.error('FCM notification error:', error);
      return {
        success: false,
        error: error.message,
        platform: 'fcm'
      };
    }
  }

  /**
   * Send Expo notification
   * @param {string} expoToken - Expo push token
   * @param {Object} notification - Notification object
   * @returns {Promise<Object>} - Expo result
   */
  async sendExpoNotification(expoToken, notification) {
    try {
      if (!Expo.isExpoPushToken(expoToken)) {
        throw new Error('Invalid Expo push token');
      }

      const message = {
        to: expoToken,
        sound: notification.settings.sound,
        title: notification.title,
        body: notification.body,
        data: {
          notificationId: notification._id.toString(),
          type: notification.type,
          ...notification.data
        },
        priority: notification.priority === 'high' ? 'high' : 'normal',
        badge: notification.settings.badge
      };

      const chunks = this.expo.chunkPushNotifications([message]);
      const tickets = [];

      for (const chunk of chunks) {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      }

      // Check for errors in tickets
      const errors = tickets.filter(ticket => ticket.status === 'error');
      if (errors.length > 0) {
        throw new Error(`Expo errors: ${errors.map(e => e.message).join(', ')}`);
      }

      return {
        success: true,
        messageId: tickets[0]?.id || 'unknown',
        platform: 'expo'
      };

    } catch (error) {
      console.error('Expo notification error:', error);
      return {
        success: false,
        error: error.message,
        platform: 'expo'
      };
    }
  }

  /**
   * Send in-app notification via WebSocket
   * @param {string} userId - User ID
   * @param {Object} notification - Notification object
   */
  async sendInAppNotification(userId, notification) {
    // This will be called from the main app with Socket.io instance
    // For now, we'll just log it
    console.log(`📱 In-app notification for user ${userId}:`, notification.title);
  }

  /**
   * Send call notification
   * @param {string} recipientId - Recipient user ID
   * @param {string} callerId - Caller user ID
   * @param {string} callType - Call type (video/audio)
   * @param {string} callId - Call ID
   * @returns {Promise<Object>} - Result
   */
  async sendCallNotification(recipientId, callerId, callType, callId) {
    try {
      const caller = await User.findById(callerId);
      if (!caller) {
        throw new Error('Caller not found');
      }

      const notificationData = {
        title: `Incoming ${callType} call`,
        body: `${caller.name} is calling you`,
        type: 'call_incoming',
        priority: 'urgent',
        channels: {
          push: true,
          inApp: true
        },
        actions: [
          {
            id: 'accept',
            title: 'Accept',
            action: 'accept'
          },
          {
            id: 'decline',
            title: 'Decline',
            action: 'decline'
          }
        ],
        data: {
          callId,
          callerId,
          callType,
          callerName: caller.name,
          callerImage: caller.profileImage
        },
        relatedEntity: {
          entityType: 'call',
          entityId: callId
        },
        senderId: callerId,
        settings: {
          sound: 'call_incoming.wav',
          vibrate: true,
          silent: false,
          category: 'call'
        }
      };

      return await this.sendNotification(recipientId, notificationData);

    } catch (error) {
      console.error('Call notification error:', error);
      return {
        error: true,
        message: error.message || 'Failed to send call notification'
      };
    }
  }

  /**
   * Send message notification
   * @param {string} recipientId - Recipient user ID
   * @param {string} senderId - Sender user ID
   * @param {string} messageContent - Message content
   * @param {string} chatId - Chat ID
   * @returns {Promise<Object>} - Result
   */
  async sendMessageNotification(recipientId, senderId, messageContent, chatId) {
    try {
      const sender = await User.findById(senderId);
      if (!sender) {
        throw new Error('Sender not found');
      }

      const notificationData = {
        title: `Message from ${sender.name}`,
        body: messageContent.length > 100 ? 
          messageContent.substring(0, 100) + '...' : 
          messageContent,
        type: 'message_received',
        priority: 'normal',
        channels: {
          push: true,
          inApp: true
        },
        actions: [
          {
            id: 'reply',
            title: 'Reply',
            action: 'reply'
          },
          {
            id: 'view',
            title: 'View',
            action: 'view'
          }
        ],
        data: {
          chatId,
          senderId,
          senderName: sender.name,
          senderImage: sender.profileImage,
          messageContent
        },
        relatedEntity: {
          entityType: 'chat',
          entityId: chatId
        },
        senderId,
        settings: {
          sound: 'message.wav',
          vibrate: true,
          silent: false,
          category: 'message'
        }
      };

      return await this.sendNotification(recipientId, notificationData);

    } catch (error) {
      console.error('Message notification error:', error);
      return {
        error: true,
        message: error.message || 'Failed to send message notification'
      };
    }
  }

  /**
   * Get Android channel ID for notification type
   * @param {string} type - Notification type
   * @returns {string} - Channel ID
   */
  getAndroidChannelId(type) {
    const channelMap = {
      'call_incoming': 'calls',
      'call_accepted': 'calls',
      'call_ended': 'calls',
      'call_declined': 'calls',
      'message_received': 'messages',
      'message_sent': 'messages',
      'follow_received': 'social',
      'follow_sent': 'social',
      'coin_purchased': 'transactions',
      'coin_deducted': 'transactions',
      'commission_earned': 'transactions',
      'payment_received': 'transactions',
      'payment_sent': 'transactions',
      'system_announcement': 'system',
      'profile_updated': 'profile',
      'stream_started': 'streams',
      'stream_ended': 'streams'
    };

    return channelMap[type] || 'default';
  }

  /**
   * Retry failed notifications
   */
  async retryFailedNotifications() {
    try {
      const pendingNotifications = await Notification.getPendingForRetry();
      
      for (const notification of pendingNotifications) {
        try {
          const user = await User.findById(notification.recipientId);
          if (!user) {
            await notification.markAsFailed('User not found');
            continue;
          }

          // Increment retry attempts
          await notification.incrementRetry();

          // Retry sending
          await this.sendPushNotification(user, notification);

        } catch (error) {
          console.error(`Retry failed for notification ${notification._id}:`, error);
          await notification.markAsFailed(error.message);
        }
      }

      console.log(`🔄 Retried ${pendingNotifications.length} notifications`);

    } catch (error) {
      console.error('Retry failed notifications error:', error);
    }
  }

  /**
   * Cleanup expired notifications
   */
  async cleanupExpiredNotifications() {
    try {
      const result = await Notification.cleanupExpired();
      console.log(`🧹 Cleaned up ${result.deletedCount} expired notifications`);
    } catch (error) {
      console.error('Cleanup expired notifications error:', error);
    }
  }

  /**
   * Get user notifications
   * @param {string} userId - User ID
   * @param {Object} options - Options
   * @returns {Promise<Object>} - Notifications
   */
  async getUserNotifications(userId, options = {}) {
    try {
      const notifications = await Notification.getUserNotifications(userId, options);
      const unreadCount = await Notification.getUnreadCount(userId);

      return {
        error: false,
        notifications,
        unreadCount,
        pagination: {
          page: options.page || 1,
          limit: options.limit || 20,
          hasMore: notifications.length === (options.limit || 20)
        }
      };

    } catch (error) {
      console.error('Get user notifications error:', error);
      return {
        error: true,
        message: error.message || 'Failed to get notifications'
      };
    }
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Result
   */
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOne({
        _id: notificationId,
        recipientId: userId
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      await notification.markAsRead();

      return {
        error: false,
        message: 'Notification marked as read'
      };

    } catch (error) {
      console.error('Mark as read error:', error);
      return {
        error: true,
        message: error.message || 'Failed to mark notification as read'
      };
    }
  }

  /**
   * Mark all notifications as read
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Result
   */
  async markAllAsRead(userId) {
    try {
      await Notification.markAllAsRead(userId);

      return {
        error: false,
        message: 'All notifications marked as read'
      };

    } catch (error) {
      console.error('Mark all as read error:', error);
      return {
        error: true,
        message: error.message || 'Failed to mark all notifications as read'
      };
    }
  }
}

module.exports = NotificationService;
