import 'react-native-gesture-handler';
import 'react-native-reanimated';
import './global.css';

// Import URL polyfill for web compatibility
import './web-url-polyfill';

// ✅ Express.js Backend Integration - Firebase removed

import React, { useEffect, useCallback, useRef } from 'react';
import { LogBox, StatusBar, AppState, TouchableOpacity, Text, StyleSheet, View, DeviceEventEmitter } from 'react-native';
import { Provider, useSelector } from 'react-redux';
import { ThemeProvider } from './theme/ThemeProvider';
import { PaperProvider } from 'react-native-paper';
import Toast from 'react-native-toast-message';
// ✅ Express.js Backend Integration - Firebase removed
import NewAuthService from './services/NewAuthService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, {
  AndroidImportance,
  EventType,
  AndroidVisibility,
} from '@notifee/react-native';

import AppNavigation from './navigations/AppNavigation';
import store from './store/store';
import WebSocketService from './services/WebSocketService';
import { navigate } from './navigations/RootNavigation';
import RingtoneManager from './utils/RingtoneManager';

LogBox.ignoreAllLogs();

/*
 * 🔥 FIREBASE CONNECTION RETRY SYSTEM
 * 
 * This app includes a comprehensive Firebase connection management system that:
 * 
 * 1. AUTOMATIC RETRY: Automatically attempts to reconnect when Firebase is unavailable
 * 2. EXPONENTIAL BACKOFF: Uses intelligent delays (2s, 4s, 8s, 16s, 32s, max 60s)
 * 3. CONNECTION TESTING: Tests actual Firestore operations, not just app initialization
 * 4. THROTTLING: Prevents rapid retry attempts (minimum 5 seconds between retries)
 * 5. STATUS MONITORING: Real-time connection status updates in the UI
 * 6. MANUAL CONTROLS: User can manually retry or run diagnostics
 * 7. INTELLIGENT RECOVERY: Detects network changes and app state changes
 * 
 * Key Functions:
 * - retryFirebaseConnection(): Manual retry trigger
 * - checkFirebaseHealth(): Test connection health
 * - diagnoseFirebaseIssues(): Comprehensive Firebase diagnostics
 * - forceFirebaseReconnection(): Force reset and retry
 * 
 * The system prevents retry loops and handles various failure scenarios gracefully.
 */

// ------------------------------
// Firebase Connection Management
// ------------------------------
class FirebaseConnectionManager {
  constructor() {
    this.maxRetries = 5;
    this.baseDelay = 2000; // 2 seconds - increased to prevent rapid retries
    this.maxDelay = 60000; // 60 seconds - increased max delay
    this.currentRetryCount = 0;
    this.isRetrying = false;
    this.retryTimer = null;
    this.connectionListeners = [];
    this.lastRetryTime = 0;
    this.minRetryInterval = 5000; // Minimum 5 seconds between retries
    this.connectionTestPromise = null;
  }

  // Enhanced Firebase availability check - Web bypass
  isFirebaseAvailable() {
    try {
      // For web environment, always return false to bypass Firebase
      if (typeof window !== 'undefined') {
        console.log('🔍 Web environment detected - bypassing Firebase');
        return false;
      }
      
      // Try to get existing app first
      let defaultApp;
      try {
        defaultApp = getApp();
      } catch (e) {
        // If no app exists, try to initialize one
        try {
          defaultApp = initializeApp();
          console.log('✅ Firebase app initialized successfully');
        } catch (initError) {
          console.log('🔍 Firebase initialization failed:', initError.message);
          return false;
        }
      }
      
      if (!defaultApp?.name) {
        return false;
      }
      
      // Additional check: try to access Firestore
      try {
        const db = getFirestore();
        return !!db;
      } catch (e) {
        console.log('🔍 Firestore check failed:', e.message);
        return false;
      }
    } catch (e) {
      console.log('🔍 Firebase app check failed:', e.message);
      return false;
    }
  }

  // Test Firebase connection with actual operation
  async testFirebaseConnection() {
    if (this.connectionTestPromise) {
      return this.connectionTestPromise;
    }

    this.connectionTestPromise = (async () => {
      try {
        if (!this.isFirebaseAvailable()) {
          return false;
        }

        // Try a simple Firestore operation
        const db = getFirestore();
        const testRef = doc(db, '_connection_test', 'ping');
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 10000)
        );
        
        const testOperation = setDoc(testRef, { 
          timestamp: Date.now(),
          test: true 
        }, { merge: true });
        
        await Promise.race([testOperation, timeoutPromise]);
        
        // Clean up test document
        try {
          await testRef.delete();
        } catch (e) {
          // Ignore cleanup errors
        }
        
        return true;
      } catch (error) {
        console.log('🔍 Firebase connection test failed:', error.message);
        return false;
      } finally {
        this.connectionTestPromise = null;
      }
    })();

    return this.connectionTestPromise;
  }

  // Check Firebase configuration
  checkFirebaseConfig() {
    try {
      const apps = getApps();
      if (apps.length === 0) {
        console.log('⚠️ No Firebase apps found, attempting to initialize...');
        try {
          const app = initializeApp();
          console.log('✅ Firebase app initialized:', app.name);
          return true;
        } catch (e) {
          console.log('❌ Firebase initialization failed:', e.message);
          return false;
        }
      } else {
        console.log('✅ Firebase apps found:', apps.length);
        return true;
      }
    } catch (error) {
      console.log('❌ Firebase config check failed:', error.message);
      return false;
    }
  }

  // Add connection listener
  addConnectionListener(callback) {
    if (!this.connectionListeners.includes(callback)) {
      this.connectionListeners.push(callback);
    }
  }

  // Remove connection listener
  removeConnectionListener(callback) {
    const index = this.connectionListeners.indexOf(callback);
    if (index > -1) {
      this.connectionListeners.splice(index, 1);
    }
  }

  // Notify all listeners about connection status
  notifyListeners(isConnected) {
    this.connectionListeners.forEach(callback => {
      try {
        callback(isConnected);
      } catch (error) {
        console.error('Error in connection listener:', error);
      }
    });
  }

  // Calculate delay with exponential backoff and jitter
  calculateDelay() {
    const delay = Math.min(this.baseDelay * Math.pow(2, this.currentRetryCount), this.maxDelay);
    const jitter = Math.random() * 2000; // Add up to 2 seconds of jitter
    return delay + jitter;
  }

  // Check if enough time has passed since last retry
  canRetry() {
    const now = Date.now();
    return (now - this.lastRetryTime) >= this.minRetryInterval;
  }

  // Retry Firebase connection with improved logic
  async retryFirebaseConnection() {
    // Prevent multiple simultaneous retries
    if (this.isRetrying) {
      console.log('🔄 Firebase retry already in progress...');
      return false;
    }

    // Check if we can retry (time-based throttling)
    if (!this.canRetry()) {
      const timeUntilRetry = this.minRetryInterval - (Date.now() - this.lastRetryTime);
      console.log(`⏳ Retry throttled, wait ${Math.round(timeUntilRetry)}ms`);
      return false;
    }

    // Check retry limit
    if (this.currentRetryCount >= this.maxRetries) {
      console.log('❌ Max Firebase retry attempts reached');
      this.notifyListeners(false);
      return false;
    }

    this.isRetrying = true;
    this.currentRetryCount++;
    this.lastRetryTime = Date.now();

    console.log(`🔄 Attempting Firebase connection retry ${this.currentRetryCount}/${this.maxRetries}...`);

    try {
      // Clear any existing timer
      if (this.retryTimer) {
        clearTimeout(this.retryTimer);
        this.retryTimer = null;
      }

      // Wait before retrying
      const delay = this.calculateDelay();
      console.log(`⏳ Waiting ${Math.round(delay)}ms before retry...`);

      await new Promise(resolve => {
        this.retryTimer = setTimeout(resolve, delay);
      });

      // Test Firebase connection with actual operation
      const isConnected = await this.testFirebaseConnection();
      
      if (isConnected) {
        console.log('✅ Firebase connection restored successfully!');
        this.currentRetryCount = 0;
        this.isRetrying = false;
        this.notifyListeners(true);
        return true;
      } else {
        console.log(`❌ Firebase connection attempt ${this.currentRetryCount} failed`);
        this.isRetrying = false;
        
        // Schedule next retry only if we haven't reached max retries
        if (this.currentRetryCount < this.maxRetries) {
          const nextDelay = this.calculateDelay();
          console.log(`⏰ Scheduling next retry in ${Math.round(nextDelay)}ms`);
          
          this.retryTimer = setTimeout(() => {
            this.retryFirebaseConnection();
          }, nextDelay);
        }
        
        return false;
      }
    } catch (error) {
      console.error('❌ Error during Firebase retry:', error);
      this.isRetrying = false;
      return false;
    }
  }

  // Reset retry count when connection is successful
  resetRetryCount() {
    this.currentRetryCount = 0;
    this.isRetrying = false;
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    this.lastRetryTime = 0;
  }

  // Force reset retry state
  forceReset() {
    console.log('🔄 Force resetting Firebase retry state');
    this.resetRetryCount();
    this.connectionTestPromise = null;
  }

  // Force Firebase initialization
  forceFirebaseInit() {
    try {
      console.log('🔄 Force initializing Firebase...');
      const apps = getApps();
      
      if (apps.length === 0) {
        const app = initializeApp();
        console.log('✅ Firebase app initialized:', app.name);
        return true;
      } else {
        console.log('✅ Firebase already initialized:', apps.length, 'apps');
        return true;
      }
    } catch (error) {
      console.error('❌ Force Firebase init failed:', error.message);
      return false;
    }
  }

  // Cleanup
  cleanup() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    this.connectionListeners = [];
    this.connectionTestPromise = null;
  }
}

// Create global Firebase connection manager instance
const firebaseManager = new FirebaseConnectionManager();

// Enhanced Firebase availability check with retry capability
function isFirebaseAvailable() {
  return firebaseManager.isFirebaseAvailable();
}

// Function to retry Firebase connection
export const retryFirebaseConnection = () => {
  return firebaseManager.retryFirebaseConnection();
};

// Function to check Firebase status
export const getFirebaseStatus = () => {
  return {
    isAvailable: firebaseManager.isFirebaseAvailable(),
    isRetrying: firebaseManager.isRetrying,
    retryCount: firebaseManager.currentRetryCount,
    maxRetries: firebaseManager.maxRetries
  };
};

// Function to check Firebase connection health
export const checkFirebaseHealth = async () => {
  try {
    if (!isFirebaseAvailable()) {
      console.log('🔍 Firebase health check: Not available');
      return { healthy: false, reason: 'Firebase not available' };
    }

    // Use the enhanced connection test
    const isConnected = await firebaseManager.testFirebaseConnection();
    
    if (isConnected) {
      console.log('🔍 Firebase health check: Healthy');
      return { healthy: true };
    } else {
      console.log('🔍 Firebase health check: Unhealthy - connection test failed');
      return { 
        healthy: false, 
        reason: 'Connection test failed',
        shouldRetry: true
      };
    }
  } catch (error) {
    console.log('🔍 Firebase health check: Unhealthy -', error.message);
    return { 
      healthy: false, 
      reason: error.message,
      shouldRetry: error.code === 'unavailable' || error.code === 'deadline-exceeded' || error.message.includes('timeout')
    };
  }
};

// Function to force Firebase reconnection
export const forceFirebaseReconnection = () => {
  console.log('🔄 Force Firebase reconnection triggered');
  firebaseManager.forceReset();
  return firebaseManager.retryFirebaseConnection();
};

// Function to force Firebase initialization
export const forceFirebaseInitialization = () => {
  console.log('🔄 Force Firebase initialization triggered');
  return firebaseManager.forceFirebaseInit();
};

// Function to check Firebase configuration
export const checkFirebaseConfig = () => {
  return firebaseManager.checkFirebaseConfig();
};

// Function to diagnose Firebase configuration issues
export const diagnoseFirebaseIssues = () => {
  const diagnosis = {
    timestamp: new Date().toISOString(),
    firebaseApp: null,
    firestore: null,
    messaging: null,
    auth: null,
    issues: []
  };

  try {
    // Check Firebase app
    try {
      let defaultApp;
      try {
        defaultApp = getApp();
      } catch (e) {
        // Try to initialize if no app exists
        try {
          defaultApp = initializeApp();
        } catch (initError) {
          throw new Error(`Initialization failed: ${initError.message}`);
        }
      }
      
      diagnosis.firebaseApp = {
        name: defaultApp?.name,
        options: defaultApp?.options,
        exists: !!defaultApp
      };
    } catch (e) {
      diagnosis.firebaseApp = { error: e.message };
      diagnosis.issues.push('Firebase app initialization failed');
    }

    // Check Firestore
    try {
      const db = getFirestore();
      diagnosis.firestore = {
        exists: !!db,
        app: db?.app?.name
      };
    } catch (e) {
      diagnosis.firestore = { error: e.message };
      diagnosis.issues.push('Firestore initialization failed');
    }

    // Check Messaging
    try {
      const msg = getMessaging();
      diagnosis.messaging = {
        exists: !!msg,
        app: msg?.app?.name
      };
    } catch (e) {
      diagnosis.messaging = { error: e.message };
      diagnosis.issues.push('Firebase messaging initialization failed');
    }

    // Check Auth
    try {
      const authInstance = getAuth();
      diagnosis.auth = {
        exists: !!authInstance,
        app: authInstance?.app?.name
      };
    } catch (e) {
      diagnosis.auth = { error: e.message };
      diagnosis.issues.push('Firebase auth initialization failed');
    }

    console.log('🔍 Firebase diagnosis:', JSON.stringify(diagnosis, null, 2));
    return diagnosis;
  } catch (error) {
    console.error('❌ Error during Firebase diagnosis:', error);
    return { error: error.message, timestamp: new Date().toISOString() };
  }
};

// Test function for Firebase retry system (can be called from console)
export const testFirebaseRetrySystem = async () => {
  console.log('🧪 Testing Firebase retry system...');
  
  try {
    // Test 1: Check current status
    const status = getFirebaseStatus();
    console.log('📊 Current status:', status);
    
    // Test 2: Run diagnosis
    const diagnosis = diagnoseFirebaseIssues();
    console.log('🔧 Diagnosis completed');
    
    // Test 3: Test connection health
    const health = await checkFirebaseHealth();
    console.log('❤️ Health check result:', health);
    
    // Test 4: If not healthy, try to retry
    if (!health.healthy) {
      console.log('🔄 Attempting retry...');
      const retryResult = await retryFirebaseConnection();
      console.log('🔄 Retry result:', retryResult);
    }
    
    console.log('✅ Firebase retry system test completed');
    return { success: true, status, diagnosis, health };
  } catch (error) {
    console.error('❌ Firebase retry system test failed:', error);
    return { success: false, error: error.message };
  }
};

// Test function to simulate incoming call
export const testIncomingCall = async (userId) => {
  try {
    console.log('🧪 [TEST] Simulating incoming call for user:', userId);
    
    const testCallData = {
      callId: `test-call-${Date.now()}`,
      type: 'INCOMING',
      callerId: 'test-caller-123',
      callerName: 'Test Caller'
    };
    
    // Update user document to simulate incoming call
    const result = await NewAuthService.updateProfile(userId, { 
      currentCall: testCallData, 
      inCall: true 
    });
    
    console.log('🧪 [TEST] Call simulation result:', result);
    return { success: true, callData: testCallData };
  } catch (error) {
    console.error('❌ [TEST] Error simulating call:', error);
    return { success: false, error: error.message };
  }
};

// Make functions available globally for console testing
if (typeof global !== 'undefined') {
  global.testFirebaseRetrySystem = testFirebaseRetrySystem;
  global.retryFirebaseConnection = retryFirebaseConnection;
  global.checkFirebaseHealth = checkFirebaseHealth;
  global.diagnoseFirebaseIssues = diagnoseFirebaseIssues;
  global.forceFirebaseReconnection = forceFirebaseReconnection;
  global.getFirebaseStatus = getFirebaseStatus;
  global.forceFirebaseInitialization = forceFirebaseInitialization;
  global.checkFirebaseConfig = checkFirebaseConfig;
  global.clearNotificationHistory = clearNotificationHistory;
  global.getNotificationHistory = getNotificationHistory;
  global.testDuplicatePrevention = testDuplicatePrevention;
  global.checkNotificationState = checkNotificationState;
  global.clearAllNotifications = clearAllNotifications;
  global.triggerTestNotification = triggerTestNotification;
  global.testIncomingCall = testIncomingCall;
}

// ------------------------------
// Enhanced Duplicate Prevention
// ------------------------------
const notificationHistory = new Map();
const NOTIFICATION_TIMEOUT = 3000; // Reduced to 3 seconds for better prevention
const MAX_HISTORY_SIZE = 100; // Prevent memory leaks

function isDuplicateNotification(data, type) {
  // Create a more specific key for better duplicate detection
  let key;
  
  if (type === 'call' || data?.callId) {
    key = `call_${data.callId}`;
  } else if (type === 'message' || data?.chatId) {
    key = `message_${data.chatId}_${data?.messageId || data?.message?.substring(0, 20)}`;
  } else if (type === 'follow' || data?.followerId) {
    key = `follow_${data.followerId}`;
  } else {
    key = `unknown_${type}_${Date.now()}`;
  }
  
  const now = Date.now();
  
  // Check if this exact notification was recently processed
  if (notificationHistory.has(key)) {
    const lastTime = notificationHistory.get(key);
    if (now - lastTime < NOTIFICATION_TIMEOUT) {
      console.log('⚠️ Duplicate notification detected within timeout:', key);
      return true;
    }
  }
  
  // Add to history
  notificationHistory.set(key, now);
  
  // Clean up old entries to prevent memory leaks
  setTimeout(() => {
    notificationHistory.delete(key);
  }, NOTIFICATION_TIMEOUT);
  
  // Limit history size
  if (notificationHistory.size > MAX_HISTORY_SIZE) {
    const oldestKey = notificationHistory.keys().next().value;
    notificationHistory.delete(oldestKey);
  }
  
  return false;
}

// Function to clear notification history (useful for testing)
function clearNotificationHistory() {
  notificationHistory.clear();
  console.log('✅ Notification history cleared');
}

// Function to check current notification history (useful for debugging)
function getNotificationHistory() {
  const history = {};
  notificationHistory.forEach((timestamp, key) => {
    history[key] = {
      timestamp,
      age: Date.now() - timestamp,
      ageSeconds: Math.round((Date.now() - timestamp) / 1000)
    };
  });
  return history;
}

// Function to test duplicate prevention system
async function testDuplicatePrevention() {
  console.log('🧪 Testing duplicate prevention system...');
  
  try {
    // Test 1: Send first notification
    console.log('📱 Sending first test notification...');
    const result1 = await triggerTestNotification();
    console.log('✅ First notification result:', result1);
    
    // Test 2: Send duplicate notification immediately
    console.log('📱 Sending duplicate test notification...');
    const result2 = await triggerTestNotification();
    console.log('✅ Duplicate notification result:', result2);
    
    // Test 3: Wait and send another notification
    console.log('⏳ Waiting 4 seconds before sending third notification...');
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    console.log('📱 Sending third test notification...');
    const result3 = await triggerTestNotification();
    console.log('✅ Third notification result:', result3);
    
    // Show current history
    console.log('📊 Current notification history:', getNotificationHistory());
    
    console.log('✅ Duplicate prevention test completed');
    return { success: true, results: [result1, result2, result3] };
    
  } catch (error) {
    console.error('❌ Duplicate prevention test failed:', error);
    return { success: false, error: error.message };
  }
}

// Function to check current notification state
async function checkNotificationState() {
  try {
    const displayedNotifications = await notifee.getDisplayedNotifications();
    
    console.log('📊 Current notification state:');
    console.log(`Total notifications: ${displayedNotifications.length}`);
    
    displayedNotifications.forEach((notification, index) => {
      console.log(`${index + 1}. ID: ${notification.id}`);
      console.log(`   Title: ${notification.title}`);
      console.log(`   Type: ${notification.data?.type || 'unknown'}`);
      console.log(`   Timestamp: ${notification.android?.showTimestamp || 'N/A'}`);
      console.log('---');
    });
    
    return { success: true, count: displayedNotifications.length, notifications: displayedNotifications };
    
  } catch (error) {
    console.error('❌ Failed to check notification state:', error);
    return { success: false, error: error.message };
  }
}

// Function to clear all notifications
async function clearAllNotifications() {
  try {
    await notifee.cancelAllNotifications();
    console.log('✅ All notifications cleared successfully');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Failed to clear notifications:', error);
    return { success: false, error: error.message };
  }
}

// ------------------------------
// Notification Channel Setup
// ------------------------------
async function setupNotificationChannels() {
  try {
         await notifee.createChannel({
       id: 'incoming_calls_v2',
       name: 'Incoming Calls',
       sound: 'my_awesome_ringtone',
       importance: AndroidImportance.HIGH,
       vibration: true,
       vibrationPattern: [300, 600],
       visibility: AndroidVisibility.PUBLIC,
       bypassDnd: true,
     });
     await notifee.createChannel({
       id: 'messages_v1',
       name: 'Messages',
       importance: AndroidImportance.HIGH,
       vibration: true,
       vibrationPattern: [150, 300],
       visibility: AndroidVisibility.PUBLIC,
     });
     await notifee.createChannel({
       id: 'social_v1',
       name: 'Social',
       importance: AndroidImportance.DEFAULT,
       vibration: true,
       vibrationPattern: [100, 200],
       visibility: AndroidVisibility.PUBLIC,
     });
     await notifee.createChannel({
       id: 'follows_v1',
       name: 'Follows',
       importance: AndroidImportance.HIGH,
       vibration: true,
       vibrationPattern: [200, 400],
       visibility: AndroidVisibility.PUBLIC,
     });
  } catch (error) {
    console.error('Failed to create notification channel', error);
  }
}

// ------------------------------
// Incoming Call Display (In-App)
// ------------------------------
export const displayIncomingCallScreen = async ({ callId, callerName, callerId, callerImage }) => {
  try {
    console.log('🔥 [displayIncomingCallScreen] Showing incoming call screen:', { callId, callerName });
    // Don't silence here; let in-app screen decide playback
    
    // Navigate to ReceiveCall screen
    navigate('ReceiveCall', { 
      callId, 
      callerName, 
      callerId, 
      callerImage,
      isIncoming: true
    });
    
    console.log('✅ [displayIncomingCallScreen] Successfully navigated to ReceiveCall screen');
  } catch (error) {
    console.error('❌ [displayIncomingCallScreen] Error showing incoming call screen:', error);
  }
};

// ------------------------------
// Call Notification Display
// ------------------------------
async function displayCallNotification(remoteMessage) {
  const { callId, callerName } = remoteMessage.data || {};
  
  // Use global duplicate prevention
  if (isDuplicateNotification(remoteMessage.data, 'call')) {
    console.log('calling')
    console.log('⚠️ Duplicate call notification detected, ensuring display:', callId);
    // As a safeguard, ensure the call notification is shown if not already displayed
    const existingNotifications = await notifee.getDisplayedNotifications();
    const existingCallNotification = existingNotifications.find(n => n.id === `call_${callId}`);
      await notifee.displayNotification({
        id: `call_${callId}`,
        title: `Incoming Call: ${callerName}`,
        body: `${callerName} is calling...`,
        data: remoteMessage.data,
        android: {
          channelId: 'incoming_calls_v2',
          smallIcon: 'ic_launcher',
          largeIcon: 'ic_launcher',
          sound: 'my_awesome_ringtone',
          loopSound: true,
          importance: AndroidImportance.HIGH,
          showTimestamp: true,
          ongoing: true,
          autoCancel: false,
          vibrationPattern: [300, 600],
          // Ensure tapping the notification body opens the app
          pressAction: { id: 'default', launchActivity: 'default' },
          fullScreenAction: { id: 'default' },
          actions: [
            {
              title: '✅ Accept',
              pressAction: { id: 'accept', launchActivity: 'default' },
              color: '#4CAF50',
            },
            {
              title: '❌ Decline',
              // Ensure decline also launches the app so we can route properly
              pressAction: { id: 'decline', launchActivity: 'default' },
              color: '#F44336',
            },
          ],
        },
      });
    
    return;
  }
  
  // Also check for existing displayed notifications as backup
  const existingNotifications = await notifee.getDisplayedNotifications();
  const existingCallNotification = existingNotifications.find(n => n.id === `call_${callId}`);
  
  if (existingCallNotification) {
    console.log('⚠️ Call notification already exists, skipping duplicate:', callId);
    return;
  }

  await notifee.displayNotification({
    id: `call_${callId}`,
    title: `Incoming Call: ${callerName}`,
    body: `${callerName} is calling...`,
    data: remoteMessage.data,
    android: {
      channelId: 'incoming_calls_v2',
      smallIcon: 'ic_launcher',
      largeIcon: 'ic_launcher',
      sound: 'my_awesome_ringtone',
      loopSound: true,
      importance: AndroidImportance.HIGH,
      showTimestamp: true,
      ongoing: true,
      autoCancel: false,
      vibrationPattern: [300, 600],
      // Ensure tapping the notification body opens the app
      pressAction: { id: 'default', launchActivity: 'default' },
      fullScreenAction: { id: 'default' },
      actions: [
        {
          title: '✅ Accept',
          pressAction: { id: 'accept', launchActivity: 'default' },
          color: '#4CAF50',
        },
        {
          title: '❌ Decline',
          // Ensure decline also launches the app so we can route properly
          pressAction: { id: 'decline', launchActivity: 'default' },
          color: '#F44336',
        },
      ],
    },
  });

  // Listen once to stop ringtone when call is accepted/rejected/ended
  const stopRingtoneAndCancel = async () => {
    await RingtoneManager.stopAll(callId);
  };
  const acceptSub = DeviceEventEmitter.addListener('CALL_ACCEPTED', stopRingtoneAndCancel);
  const declineSub = DeviceEventEmitter.addListener('CALL_DECLINED', stopRingtoneAndCancel);
  const endSub = DeviceEventEmitter.addListener('CALL_ENDED', stopRingtoneAndCancel);
  // Auto-clean listeners shortly after to avoid leaks
  setTimeout(() => {
    try { acceptSub.remove(); } catch (_) {}
    try { declineSub.remove(); } catch (_) {}
    try { endSub.remove(); } catch (_) {}
  }, 60000);
}

// ------------------------------
// Message Notification Display
// ------------------------------
async function displayMessageNotification(remoteMessage) {
  const data = remoteMessage?.data || {};
  const title = data?.senderName || remoteMessage?.notification?.title || 'New message';
  const body = data?.message || remoteMessage?.notification?.body || 'You have a new message';
  
  // Use global duplicate prevention
  if (isDuplicateNotification(data, 'message')) {
    console.log('⚠️ Duplicate message notification detected, skipping');
    return;
  }
  
  // Create a unique ID for the message
  const messageId = `msg_${data?.chatId || data?.messageId || Date.now()}`;
  
  // Also check for existing displayed notifications as backup
  const existingNotifications = await notifee.getDisplayedNotifications();
  const existingMessageNotification = existingNotifications.find(n => 
    n.id === messageId || 
    (n.data?.chatId === data?.chatId && n.data?.message === data?.message)
  );
  
  if (existingMessageNotification) {
    console.log('⚠️ Message notification already exists, skipping duplicate:', messageId);
    return;
  }

  await notifee.displayNotification({
    id: messageId,
    title,
    body,
    data: { ...data, type: 'message' },
    android: {
      channelId: 'messages_v1',
      smallIcon: 'ic_launcher',
      pressAction: { id: 'open_chat', launchActivity: 'default' },
      showTimestamp: true,
      importance: AndroidImportance.HIGH,
      color: '#00A3FF', // Add color property for Notifee
     },
   });
}

// ------------------------------
// Follow Notification Display
// ------------------------------
async function displayFollowNotification(remoteMessage) {
  const data = remoteMessage?.data || {};
  const followerName = data?.followerName || 'Someone';
  
  // Use global duplicate prevention
  if (isDuplicateNotification(data, 'follow')) {
    console.log('⚠️ Duplicate follow notification detected, skipping');
    return;
  }
  
  // Create a unique ID for the follow notification
  const followId = `follow_${data?.followerId || Date.now()}`;
  
  // Also check for existing displayed notifications as backup
  const existingNotifications = await notifee.getDisplayedNotifications();
  const existingFollowNotification = existingNotifications.find(n => 
    n.id === followId || 
    (n.data?.type === 'follow' && n.data?.followerId === data?.followerId)
  );
  
  if (existingFollowNotification) {
    console.log('⚠️ Follow notification already exists, skipping duplicate:', followId);
    return;
  }

  await notifee.displayNotification({
    id: followId,
    title: 'New Follower',
    body: `${followerName} started following you`,
    data: { ...data, type: 'follow' },
    android: {
      channelId: 'follows_v1',
      smallIcon: 'ic_launcher',
      pressAction: { id: 'open_followers', launchActivity: 'default' },
      showTimestamp: true,
      color: '#9C27B0', // Add color property for Notifee
     },
   });
}

// ------------------------------
// Save Token in Firestore Array
// ------------------------------
async function saveTokenToFirestore(userId, token) {
  if (!userId || !token) return;

  try {
    if (!isFirebaseAvailable()) {
      console.log('⚠️ Firebase not available, attempting to retry connection...');
      const retryResult = await firebaseManager.retryFirebaseConnection();
      if (!retryResult) {
        console.log('❌ Failed to restore Firebase connection, will retry later');
        return;
      }
    }

    const lastToken = await AsyncStorage.getItem('fcm_token');
    if (lastToken === token) {
      return;
    }

    const db = getFirestore();
    const ref = doc(db, 'user', userId);
    
    // Store FCM token as an array for consistency
    await setDoc(ref, { 
      fcmTokens: [token],  // Always store as array
      lastTokenUpdate: serverTimestamp()
    }, { merge: true });

    await AsyncStorage.setItem('fcm_token', token);
    console.log('✅ FCM token saved to Firestore as array');
    
    // Reset retry count on successful operation
    firebaseManager.resetRetryCount();
  } catch (error) {
    console.error('❌ Token save error:', error);
    
    // If it's a Firebase connection error, try to retry
    if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
      console.log('🔄 Firebase connection error detected, scheduling retry...');
      setTimeout(() => {
        firebaseManager.retryFirebaseConnection();
      }, 2000);
    }
  }
}

// ------------------------------
// Remove Token on Logout
// ------------------------------
async function removeTokenFromFirestore(userId) {
  try {
    if (!isFirebaseAvailable()) {
      console.log('⚠️ Firebase not available, attempting to retry connection...');
      const retryResult = await firebaseManager.retryFirebaseConnection();
      if (!retryResult) {
        console.log('❌ Failed to restore Firebase connection, will retry later');
        return;
      }
    }
    
    const token = await AsyncStorage.getItem('fcm_token');
    if (userId && token) {
      const db = getFirestore();
      const ref = doc(db, 'user', userId);
      
      // Get current tokens and remove the specific token
      const userDoc = await getDoc(ref);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const currentTokens = userData.fcmTokens || [];
        
        // Remove the specific token from the array
        const updatedTokens = currentTokens.filter(t => t !== token);
        
        await updateDoc(ref, { 
          fcmTokens: updatedTokens,
          lastTokenUpdate: serverTimestamp()
        });
        
        console.log('✅ FCM token removed from Firestore');
      }
    }
    await AsyncStorage.removeItem('fcm_token');
    
    // Reset retry count on successful operation
    firebaseManager.resetRetryCount();
  } catch (error) {
    console.error('❌ Token removal error:', error);
    
    // If it's a Firebase connection error, try to retry
    if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
      console.log('🔄 Firebase connection error detected, scheduling retry...');
      setTimeout(() => {
        firebaseManager.retryFirebaseConnection();
      }, 2000);
    }
  }
}

// ------------------------------
// Background Notification Handling
// ------------------------------
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.ACTION_PRESS || type === EventType.PRESS) {

    console.log('🔴 Background notification event:',type, detail);
    const { notification, pressAction } = detail || {};
    const data = notification?.data || {};
    const { callId, callerId, chatId } = data;
    if (notification?.id) {
      await notifee.cancelNotification(notification.id);
      try { await notifee.stopForegroundService(); } catch (_) {}
    }
    const actionId = pressAction?.id;
    if (actionId === 'accept') {
      try { DeviceEventEmitter.emit('CALL_ACCEPTED'); } catch (_) {}
      // Route to Call screen to handle join immediately
      navigate('Call', { id: { callId }, userId: callerId, shouldJoin: true });
    } else if (actionId === 'decline') {
      console.log('🔥 [BACKGROUND] Call declined from notification');
      try { DeviceEventEmitter.emit('CALL_DECLINED'); } catch (_) {}
      // Route to Call screen with end flag to ensure both sides end cleanly
      navigate('Call', { id: { callId }, userId: callerId, end: true, shouldJoin: false });
    } else if (actionId === 'open_chat' || data?.type === 'message') {
      if (chatId) navigate('Chat', { chatId });
    } else if (actionId === 'open_followers' || data?.type === 'follow') {
      navigate('Follower');
    }
  }
});

// ------------------------------
// FCM Message Handler (Single Handler)
// ------------------------------
let fcmMessageHandler = null;

async function handleFCMessage(remoteMessage, isBackground = false) {
  try {
    const data = remoteMessage?.data || {};
    const type = (data?.type || '').toString().toLowerCase();
    
    console.log(`📱 FCM ${isBackground ? 'background' : 'foreground'} message:`, {
      type,
      callId: data?.callId,
      chatId: data?.chatId,
      followerId: data?.followerId,
      message: data?.message?.substring(0, 50) + '...'
    });
    
    // Use global duplicate prevention
    if (isDuplicateNotification(data, type)) {
      console.log('⚠️ Duplicate FCM message detected, skipping:', type);
      return;
    }
    
    // Route to appropriate notification display
    if (type === 'call' || data?.callId) {
      await displayCallNotification(remoteMessage);
    } else if (type === 'message' || data?.chatId || data?.message) {
      await displayMessageNotification(remoteMessage);
    } else if (type === 'follow' || data?.followerId) {
      await displayFollowNotification(remoteMessage);
    } else {
      console.log('⚠️ Unknown FCM message type:', type);
    }
  } catch (error) {
    console.error('❌ Error handling FCM message:', error);
  }
}

// Set up background message handler only once
try {
  if (isFirebaseAvailable()) {
    // Remove any existing background handler
    if (fcmMessageHandler) {
      getMessaging().setBackgroundMessageHandler(null);
    }
    
    // Set new background handler
    fcmMessageHandler = async (remoteMessage) => {
      await handleFCMessage(remoteMessage, true);
    };
    
    getMessaging().setBackgroundMessageHandler(fcmMessageHandler);
    console.log('✅ Background FCM handler set up successfully');
  } else {
    console.log('⚠️ Firebase not available for background messaging, will retry when available');
    // Schedule retry for background messaging
    setTimeout(async () => {
      if (isFirebaseAvailable()) {
        console.log('✅ Firebase now available, setting up background messaging');
        fcmMessageHandler = async (remoteMessage) => {
          await handleFCMessage(remoteMessage, true);
        };
        getMessaging().setBackgroundMessageHandler(fcmMessageHandler);
      }
    }, 5000); // Retry after 5 seconds
  }
} catch (e) {
  // Firebase not configured; skip background handler
  console.log('⚠️ Firebase background messaging setup failed:', e.message);
}

// ------------------------------
// Test Notification Display
// ------------------------------
async function displayTestNotification() {
  try {
    console.log('🧪 Attempting to display test notification...');
    
         const notificationConfig = {
       id: 'test_notification',
       title: '🎉 Streamer App Ready!',
       body: 'Notification system is working properly',
       data: { type: 'test', message: 'Test notification from streamer app' },
       android: {
         channelId: 'messages_v1',
         smallIcon: 'ic_launcher',
         pressAction: { id: 'default', launchActivity: 'default' },
         showTimestamp: true,
         importance: AndroidImportance.HIGH,
         vibrationPattern: [100, 200, 300, 400], // Even number of values
         color: '#00A3FF',
       },
     };
    
    console.log('📱 Notification config:', JSON.stringify(notificationConfig, null, 2));
    
    const result = await notifee.displayNotification(notificationConfig);
    console.log('✅ Test notification displayed successfully, result:', result);
  } catch (error) {
    console.error('❌ Failed to display test notification:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
  }
}

// ------------------------------
// Manual Test Notification Function
// ------------------------------
export const triggerTestNotification = async () => {
  try {
    console.log('🧪 Manual test notification triggered...');
    
         const notificationConfig = {
       id: 'manual_test_notification',
       title: '🧪 Manual Test Notification',
       body: 'This notification was triggered manually for testing',
       data: { type: 'manual_test', timestamp: Date.now() },
       android: {
         channelId: 'messages_v1',
         smallIcon: 'ic_launcher',
         pressAction: { id: 'default', launchActivity: 'default' },
         showTimestamp: true,
         importance: AndroidImportance.HIGH,
         vibrationPattern: [200, 400, 200, 400], // Even number of values
         color: '#9C27B0',
       },
     };
    
    console.log('📱 Manual notification config:', JSON.stringify(notificationConfig, null, 2));
    
    const result = await notifee.displayNotification(notificationConfig);
    console.log('✅ Manual test notification displayed successfully, result:', result);
    return { success: true, message: 'Test notification sent', result };
  } catch (error) {
    console.error('❌ Failed to display manual test notification:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return { success: false, message: error.message, error: error.toString() };
  }
};

// ------------------------------
// Check Notification Permissions
// ------------------------------
async function checkNotificationPermissions() {
  try {
    const settings = await notifee.getNotificationSettings();
    console.log('📱 Notification settings:', {
      authorizationStatus: settings.authorizationStatus,
      android: {
        alarm: settings.android?.alarm,
        badge: settings.android?.badge,
        lockScreen: settings.android?.lockScreen,
        notificationCenter: settings.android?.notificationCenter,
        sound: settings.android?.sound,
      }
    });
    
    if (settings.authorizationStatus === 1) {
      console.log('✅ Notification permissions granted');
    } else {
      console.log('⚠️ Notification permissions not fully granted:', settings.authorizationStatus);
    }
    
    return settings;
  } catch (error) {
    console.error('❌ Failed to check notification permissions:', error);
    return null;
  }
}

// ------------------------------
// Main App Content
// ------------------------------
function AppContent() {
  console.log('🔍 AppContent component instantiated');
  const { user } = useSelector((state) => state.auth);
  console.log('🔍 AppContent user from Redux:', user?.id || 'none');

  // Initialize WebSocket connection when user is logged in
  useEffect(() => {
    if (user?.id) {
      console.log('🔌 Initializing WebSocket connection for user:', user.id);
      WebSocketService.connect(user.id);
      
      // Set up WebSocket event listeners
      WebSocketService.on('incoming-call', (data) => {
        console.log('📞 Incoming call via WebSocket:', data);
        // Handle incoming call
      });
      
      WebSocketService.on('balance-updated', (data) => {
        console.log('💰 Balance updated via WebSocket:', data);
        // Handle balance update
      });
      
      WebSocketService.on('call-ended', (data) => {
        console.log('📞 Call ended via WebSocket:', data);
        // Handle call end
      });
      
      return () => {
        console.log('🔌 Disconnecting WebSocket for user:', user.id);
        WebSocketService.disconnect();
      };
    }
  }, [user?.id]);

  const handleNotificationEvent = useCallback(async ({ type, detail }) => {
    if (type === EventType.ACTION_PRESS || type === EventType.PRESS) {
      const { notification, pressAction } = detail;
      const data = notification?.data || {};


      if (pressAction?.id === 'accept') {
        try { DeviceEventEmitter.emit('CALL_ACCEPTED'); } catch (_) {}
        navigate('Call', { id: { callId: data.callId }, userId: data.callerId, shouldJoin: true });
      } else if (pressAction?.id === 'decline') {
        console.log('🔥 [FOREGROUND] Call declined from notification');
        try { DeviceEventEmitter.emit('CALL_DECLINED'); } catch (_) {}
        navigate('Call', { id: { callId: data.callId }, userId: data.callerId, end: true, shouldJoin: false });
      } else if (pressAction?.id === 'open_chat' || data?.type === 'message') {
        if (data?.chatId) navigate('Chat', { chatId: data.chatId });
      } else if (pressAction?.id === 'open_followers' || data?.type === 'follow') {
        navigate('Follower');
      }
      if (notification?.id) { await notifee.cancelNotification(notification.id); try { await notifee.stopForegroundService(); } catch (_) {} }
    }
  }, []);

  useEffect(() => {
    // Permissions
    notifee.requestPermission().catch(() => console.log('Permission denied'));

    // Clear all existing notifications on app start to prevent duplicates
    notifee.cancelAllNotifications().then(() => {
      console.log('✅ Cleared all existing notifications on app start');
    }).catch(error => {
      console.log('⚠️ Could not clear notifications:', error);
    });

    // Notification channel
    setupNotificationChannels();

    // Check notification permissions for debugging
    setTimeout(() => {
      checkNotificationPermissions();
    }, 1000); // 1 second delay

    // Display test notification after a short delay
    // const testNotificationTimer = setTimeout(() => {
    //   displayTestNotification();
    // }, 2000); // 2 second delay

    // Foreground listener
    const unsubscribeForeground = notifee.onForegroundEvent(handleNotificationEvent);

    // Global stop listeners to ensure no lingering/duplicate ringtones
    const stopAll = async () => {
      try { await RingtoneManager.stopAll(); } catch (_) {}
    };
    const subAccept = DeviceEventEmitter.addListener('CALL_ACCEPTED', stopAll);
    const subDecline = DeviceEventEmitter.addListener('CALL_DECLINED', stopAll);
    const subEnd = DeviceEventEmitter.addListener('CALL_ENDED', stopAll);

    // Handle cold-start from notification tap
    (async () => {
      try {
        const initial = await notifee.getInitialNotification();
        if (initial) {
          const { notification, pressAction } = initial;
          const data = notification?.data || {};
          if (pressAction?.id === 'accept') {
            const { callId, callerId } = data;
            navigate('Call', { id: { callId }, userId: callerId, shouldJoin: true });
          } else if (pressAction?.id === 'decline') {
            console.log('🔥 [COLD-START] Call declined from notification');
            const { callId, callerId } = data;
            navigate('Call', { id: { callId }, userId: callerId, end: true, shouldJoin: false });
          } else if (pressAction?.id === 'open_chat' || data?.type === 'message') {
            if (data?.chatId) {
              navigate('Chat', { chatId: data.chatId });
            }
          } else if (pressAction?.id === 'open_followers' || data?.type === 'follow') {
            navigate('Follower');
          }
        }
      } catch (e) {
        // ignore
      }
    })();

    // App state listener
    const subscription = AppState.addEventListener('change', async () => {
      if (user?.id && typeof NewAuthService.updateStatusShow === 'function') {
        await NewAuthService.updateStatusShow(user.id, true);
      }
    });

    // FCM setup & cleanup
    let unsubscribeOnMessage;
    let fcmSetupInProgress = false;
    
    const setupFCM = async () => {
      // Prevent multiple simultaneous FCM setup attempts
      if (fcmSetupInProgress) {
        console.log('⚠️ FCM setup already in progress, skipping...');
        return;
      }
      
      fcmSetupInProgress = true;
      console.log('🔴 Setting up FCM...', isFirebaseAvailable());
      
      try {
        if (!isFirebaseAvailable()) {
          console.log('⚠️ Firebase not available, attempting to retry connection...');
          const retryResult = await firebaseManager.retryFirebaseConnection();
          if (!retryResult) {
            console.log('❌ Failed to restore Firebase connection, will retry later');
            // Schedule retry for FCM setup with longer delay
            setTimeout(() => {
              if (user?.id) {
                fcmSetupInProgress = false;
                setupFCM();
              }
            }, 15000); // Retry after 15 seconds
            return;
          }
        }
        
        console.log("✅ Firebase is available");
        // Ensure device is registered and permissions requested
        try { await getMessaging().registerDeviceForRemoteMessages(); } catch (e) {}
        let authStatus = await getMessaging().hasPermission();
        if (!authStatus) {
          try { authStatus = await getMessaging().requestPermission(); } catch (e) {}
        }
        console.log("🔥 [FCM] Auth status:", authStatus);
        if (!authStatus) {
          console.log('⚠️ FCM permission not granted');
          fcmSetupInProgress = false;
          return;
        }
        
        const token = await getMessaging().getToken();
        console.log("🔥 [FCM] Token obtained:", token ? 'YES' : 'NO');
        console.log("🔥 [FCM] Token length:", token?.length || 0);
        await saveTokenToFirestore(user?.id, token);
        
        // Foreground FCM handler - use consolidated handler
        unsubscribeOnMessage = getMessaging().onMessage(async (remoteMessage) => {
          console.log('🔥 [FOREGROUND] FCM message received while app is open');
          
          // Handle incoming call in foreground - show calling screen
          const data = remoteMessage?.data || {};
          if ((data.type || '').toString().toLowerCase() === 'call') {
            const { callId, callerName, callerId, callerImage } = data;
            console.log('🔥 [FOREGROUND] Incoming call detected:', { callId, callerName, callerId });
            
            // Show incoming call screen
            await displayIncomingCallScreen({ callId, callerName, callerId, callerImage });
          } else {
            // Handle other message types normally
            await handleFCMessage(remoteMessage, false);
          }
        });
        
        // Reset retry count on successful FCM setup
        firebaseManager.resetRetryCount();
        console.log('✅ FCM setup completed successfully');
        
      } catch (error) {
        console.error('FCM setup failed:', error);
        
        // If it's a Firebase connection error, try to retry
        if (error.code === 'unavailable' || error.code === 'deadline-exceeded' || error.message.includes('timeout')) {
          console.log('🔄 Firebase connection error detected, scheduling FCM retry...');
          setTimeout(() => {
            if (user?.id) {
              fcmSetupInProgress = false;
              setupFCM();
            }
          }, 10000); // Retry after 10 seconds
        } else {
          // For other errors, reset the flag and don't retry
          fcmSetupInProgress = false;
        }
      } finally {
        // Ensure the flag is reset if we exit early
        if (!fcmSetupInProgress) {
          fcmSetupInProgress = false;
        }
      }
    };

    if (user?.id) {
      // ✅ Firebase and FCM disabled - using Express.js backend for notifications
      console.log('🔍 User authenticated, Firebase/FCM setup skipped (using Express.js backend)');
      
      // Remove Firebase connection checks - no longer needed
      // const connectionCheckInterval = setInterval(() => {
      //   if (!isFirebaseAvailable() && !firebaseManager.isRetrying) {
      //     console.log('⚠️ Periodic check: Firebase not available, attempting reconnection...');
      //     firebaseManager.retryFirebaseConnection();
      //   }
      // }, 60000);
    
    // Enhanced notification cleanup to prevent duplicates
    const notificationCleanupInterval = setInterval(async () => {
      try {
        const displayedNotifications = await notifee.getDisplayedNotifications();
        if (displayedNotifications.length > 0) {
          console.log(`🧹 Cleaning up ${displayedNotifications.length} displayed notifications`);
          
          // Group notifications by type and keep only the most recent
          const notificationsByType = new Map();
          
          displayedNotifications.forEach(notification => {
            const type = notification.data?.type || 'unknown';
            const timestamp = notification.android?.showTimestamp || Date.now();
            
            if (!notificationsByType.has(type) || 
                timestamp > notificationsByType.get(type).timestamp) {
              notificationsByType.set(type, {
                id: notification.id,
                timestamp: timestamp
              });
            }
          });
          
          // Cancel all notifications except the most recent of each type
          displayedNotifications.forEach(notification => {
            const type = notification.data?.type || 'unknown';
            const mostRecent = notificationsByType.get(type);
            
            if (mostRecent && mostRecent.id !== notification.id) {
              notifee.cancelNotification(notification.id);
              console.log(`🗑️ Cancelled duplicate ${type} notification: ${notification.id}`);
            }
          });
          
          console.log(`✅ Kept ${notificationsByType.size} unique notifications, cancelled ${displayedNotifications.length - notificationsByType.size} duplicates`);
        }
      } catch (error) {
        console.log('⚠️ Notification cleanup error:', error);
      }
    }, 15000); // Check every 15 seconds for more aggressive cleanup
      
      // Cleanup interval on unmount
      return () => {
        clearInterval(connectionCheckInterval);
        clearInterval(notificationCleanupInterval);
      };
    } else {
      removeTokenFromFirestore(user?.id);
    }

    return () => {
      unsubscribeForeground();
      subscription.remove();
      if (typeof unsubscribeOnMessage === 'function') unsubscribeOnMessage();
      // clearTimeout(testNotificationTimer); // Clear the timer on cleanup
      try { subAccept.remove(); } catch (_) {}
      try { subDecline.remove(); } catch (_) {}
      try { subEnd.remove(); } catch (_) {}
      
      // Cleanup Firebase manager
      firebaseManager.cleanup();
    };
  }, [user, handleNotificationEvent]);

  console.log('🔍 AppContent rendering - about to render AppNavigation');
  
  let navigationComponent;
  try {
    navigationComponent = <AppNavigation />;
    console.log('✅ AppNavigation component created successfully');
  } catch (error) {
    console.error('❌ Error creating AppNavigation component:', error);
    navigationComponent = <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><Text>Navigation Error: {error.message}</Text></View>;
  }
  
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" />
      {navigationComponent}
      
      {/* Firebase Connection Status Indicator - Removed since Firebase is working */}
      
      {/* Floating Test Notification Button - Commented out for now */}
      {/* <TouchableOpacity 
        style={styles.testButton}
        onPress={() => console.log('Test notification button pressed')}
        activeOpacity={0.8}
      >
        <Text style={styles.testButtonText}>🧪</Text>
      </TouchableOpacity> */}
      
      <Toast />
    </>
  );
}

// ------------------------------
// Root App
// ------------------------------
export default function App() {
  console.log('🔍 Main App component rendering');
  
  try {
    console.log('🔍 Creating providers...');
    console.log('🔍 ThemeProvider available:', !!ThemeProvider);
    console.log('🔍 Provider (Redux) available:', !!Provider);
    console.log('🔍 PaperProvider available:', !!PaperProvider);
    console.log('🔍 store available:', !!store);
    console.log('🔍 AppContent available:', !!AppContent);
    
    return (
      <ThemeProvider>
        <Provider store={store}>
          <PaperProvider>
            <AppContent />
          </PaperProvider>
        </Provider>
      </ThemeProvider>
    );
  } catch (error) {
    console.error('❌ Error in main App component:', error);
    console.error('❌ Error stack:', error.stack);
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20}}>
        <Text style={{fontSize: 18, color: 'red', textAlign: 'center'}}>App Error:</Text>
        <Text style={{fontSize: 14, color: '#333', marginTop: 10, textAlign: 'center'}}>{error.message}</Text>
        <Text style={{fontSize: 12, color: '#666', marginTop: 10}}>Check console for details</Text>
      </View>
    );
  }
}

// ------------------------------
// Styles
// ------------------------------
const styles = StyleSheet.create({
  testButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#9C27B0',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    zIndex: 1000,
  },
  testButtonText: {
    fontSize: 24,
    color: 'white',
  },
});
