import 'react-native-gesture-handler';
import 'react-native-reanimated';
import './global.css';

// Import URL polyfill for web compatibility
import './web-url-polyfill';

// ✅ Express.js Backend Integration - No Firebase
import React, { useEffect, useCallback, useRef } from 'react';
import { LogBox, StatusBar, AppState, TouchableOpacity, Text, StyleSheet, View, DeviceEventEmitter } from 'react-native';
import { Provider, useSelector } from 'react-redux';
import { ThemeProvider } from './theme/ThemeProvider';
import { PaperProvider } from 'react-native-paper';
import Toast from 'react-native-toast-message';
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
 * 🚀 EXPRESS.JS BACKEND INTEGRATION
 * 
 * This app (USER APP) now uses a pure Express.js backend without Firebase dependency.
 * All authentication, data storage, and real-time features are handled
 * by the Express.js server with MongoDB.
 */

// Backend Connection Management (No Firebase)
class BackendConnectionManager {
  constructor() {
    this.isConnected = false;
    this.connectionListeners = [];
  }

  // Simple backend health check
  async checkBackendHealth() {
    try {
      const response = await fetch('http://localhost:3002/api/health');
      const data = await response.json();
      this.isConnected = response.ok;
      return response.ok;
      } catch (error) {
      console.log('Backend health check failed:', error.message);
      this.isConnected = false;
        return false;
    }
  }

  // Add connection listener
  addConnectionListener(listener) {
    this.connectionListeners.push(listener);
  }

  // Remove connection listener
  removeConnectionListener(listener) {
    this.connectionListeners = this.connectionListeners.filter(l => l !== listener);
  }

  // Notify listeners of connection status changes
  notifyListeners(isConnected) {
    this.connectionListeners.forEach(listener => {
      try {
        listener(isConnected);
      } catch (error) {
        console.error('Error notifying connection listener:', error);
      }
    });
  }
}

// Create global backend manager instance
const backendManager = new BackendConnectionManager();

// Main App Content Component
const AppContent = () => {
  const user = useSelector((state) => state.auth?.user);
  const appState = useRef(AppState.currentState);
  const [backendConnected, setBackendConnected] = React.useState(false);
  const [notificationCount, setNotificationCount] = React.useState(0);

  console.log('🔍 AppContent component instantiated');
  console.log('🔍 AppContent user from Redux:', user ? `User ID: ${user.id}` : 'none');

  // Handle app state changes
  const handleAppStateChange = useCallback((nextAppState) => {
    console.log(`🔄 App state changed from ${appState.current} to ${nextAppState}`);
    
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      console.log('🔄 App coming to foreground');
      // Check backend health when app becomes active
      backendManager.checkBackendHealth().then(isConnected => {
        setBackendConnected(isConnected);
      });
    }

    appState.current = nextAppState;
  }, []);

  // Initialize app
  useEffect(() => {
    console.log('🔍 AppContent useEffect - Initializing app...');

    // Add app state listener
    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    // Add backend connection listener
    const connectionListener = (isConnected) => {
      setBackendConnected(isConnected);
    };
    backendManager.addConnectionListener(connectionListener);

    // Initial backend health check
    backendManager.checkBackendHealth().then(isConnected => {
      setBackendConnected(isConnected);
    });

    // Setup notification handling
    setupNotifications();

    return () => {
      console.log('🧹 AppContent cleanup - Removing listeners...');
      appStateSubscription?.remove();
      backendManager.removeConnectionListener(connectionListener);
    };
  }, [handleAppStateChange]);

  // Setup notifications
  const setupNotifications = async () => {
    try {
      // Clear existing notifications on app start
    await notifee.cancelAllNotifications();
      setNotificationCount(0);
      console.log('✅ Cleared all existing notifications on app start');

      // Handle notification events
      const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
        if (type === EventType.DISMISSED) {
          console.log('🔔 User dismissed notification:', detail.notification?.id);
        } else if (type === EventType.PRESS) {
          console.log('🔔 User pressed notification:', detail.notification?.id);
          // Handle notification press
          if (detail.notification?.data?.type === 'call') {
            // Navigate to call screen
            navigate('Call', { callId: detail.notification?.data?.callId });
          }
        }
      });

      return unsubscribe;
  } catch (error) {
      console.error('❌ Error setting up notifications:', error);
    }
  };

  // Handle notification permissions
  useEffect(() => {
    const checkNotificationPermissions = async () => {
  try {
    const settings = await notifee.getNotificationSettings();
        console.log('📱 Notification settings:', settings);
        
        if (settings.authorizationStatus !== 1) { // 1 = AUTHORIZED
      console.log('⚠️ Notification permissions not fully granted:', settings.authorizationStatus);
    
          // Request permissions if not granted
          const newSettings = await notifee.requestPermission();
          console.log('📱 New notification settings after request:', newSettings);
        }
  } catch (error) {
        console.error('❌ Error checking notification permissions:', error);
      }
    };

    checkNotificationPermissions();
  }, []);

  console.log('🔍 AppContent rendering - about to render AppNavigation');

  // Render the main navigation
  const AppNavigationComponent = React.useMemo(() => {
    console.log('✅ AppNavigation component created successfully');
    return <AppNavigation />;
  }, []);

  return AppNavigationComponent;
};

// Main App Component
const App = () => {
  console.log('🔍 Main App component rendering');
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
          <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
          <AppContent />
          <Toast />
        </PaperProvider>
      </Provider>
    </ThemeProvider>
  );
};

export default App;
