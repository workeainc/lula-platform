// notificationHandler.js
import { navigate } from './navigations/RootNavigation';
import CallManager from './utils/CallManager';
import NewAuthService from './services/NewAuthService';
import AsyncStorage from '@react-native-async-storage/async-storage';

async function getCurrentUserFromStorage() {
  const userStr = await AsyncStorage.getItem('currentUser');
  return userStr ? JSON.parse(userStr) : null;
}

async function handleAcceptCallNotification(callId, callerId) {
  try {
    // 3. Navigate to call screen
    navigate('Call', { id: { callId } });
  } catch (err) {
    console.error('Error handling accept call from notification:', err);
  }
}

export default handleAcceptCallNotification;
