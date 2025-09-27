import { registerRootComponent } from 'expo';
import notifee, { EventType, AndroidImportance, AndroidVisibility } from '@notifee/react-native';
import { DeviceEventEmitter } from 'react-native';
import RingtoneManager from './utils/RingtoneManager';
import App from './App';

// ✅ Express.js Backend Integration - Firebase removed

// Handle background notification action presses
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.ACTION_PRESS) {
    const { notification, pressAction } = detail || {};
    const data = notification?.data || {};
    const nType = data?.type;
    try {
      if (notification?.id) {
        await notifee.cancelNotification(notification.id);
        try { await notifee.stopForegroundService(); } catch (_) {}
      }
    } catch { }
    if (nType === 'call') {
      const { callId } = data;
      // Navigation may not be ready in headless; it will be handled again on app start
      if (pressAction?.id === 'accept' || pressAction?.id === 'default') {
        try { DeviceEventEmitter.emit('CALL_ACCEPTED'); } catch (_) {}
      }
      if (pressAction?.id === 'decline') {
        try { DeviceEventEmitter.emit('CALL_DECLINED'); } catch (_) {}
      }
      return;
    }
  }
});

// Initialize ringtone manager
RingtoneManager.initialize();

// Register the main component
registerRootComponent(App);