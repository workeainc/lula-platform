# Notification System Setup Guide for Streamer App

## Overview
This guide explains how to set up and test the notification system for the streamer app to ensure messages and follow notifications are properly sent to users.

## What Was Fixed

### 1. **Notification Service Implementation**
- Created a comprehensive `NotificationService.js` that handles FCM token management
- Integrated with Firebase Cloud Messaging for push notifications
- Added support for different notification types (messages, follows, calls)

### 2. **Service Integration**
- Updated `FollowService.js` to automatically send notifications when users follow streamers
- Updated `ChatService.js` to automatically send notifications when messages are sent
- Both services now integrate with the NotificationService

### 3. **Firebase Cloud Functions**
- Added comprehensive notification functions in `functions/index.js`
- `sendMessageNotification`: Triggers when new messages are created
- `sendFollowNotification`: Triggers when new follows are created
- Both functions handle both FCM (streamer app) and Expo (user app) tokens

### 4. **Notifee Integration**
- Enhanced `notifee-handler.js` for proper background notification handling
- Added notification channels for different notification types
- Implemented proper notification tap handling

## Setup Requirements

### 1. **Firebase Configuration**
Ensure your Firebase project has:
- Cloud Messaging enabled
- Cloud Functions enabled
- Proper service account permissions

### 2. **Environment Variables**
Set up Stream Chat credentials in Firebase Functions:
```bash
firebase functions:config:set stream.key="YOUR_STREAM_API_KEY"
firebase functions:config:set stream.secret="YOUR_STREAM_API_SECRET"
```

### 3. **Dependencies**
The following packages are required:
```json
{
  "@notifee/react-native": "^9.1.8",
  "@react-native-firebase/messaging": "21.11.0",
  "@react-native-firebase/firestore": "21.11.0"
}
```

## Testing the Notification System

### 1. **Test Follow Notifications**
```javascript
// In your FollowService test
import FollowService from '../services/FollowService';

// Test following a streamer
const result = await FollowService.followUser('user123', 'streamer456');
console.log('Follow result:', result);
```

**Expected Behavior:**
- Follow record is created in Firestore
- `sendFollowNotification` Cloud Function is triggered
- Streamer receives FCM notification
- User receives Expo notification confirmation

### 2. **Test Message Notifications**
```javascript
// In your ChatService test
import ChatService from '../services/ChatService';

// Test sending a message
const messageData = {
  content: 'Hello from streamer!',
  sender: 'STREAMER',
  senderId: 'streamer456',
  createdAt: new Date()
};

const result = await ChatService.sendMessage('chat123', messageData);
console.log('Message result:', result);
```

**Expected Behavior:**
- Message is saved to Firestore
- `sendMessageNotification` Cloud Function is triggered
- Recipient receives appropriate notification based on token type

### 3. **Test FCM Token Registration**
```javascript
// In your app initialization
import NotificationService from '../services/NotificationService';

// The service automatically sets up FCM when instantiated
// Check console logs for FCM token registration
```

**Expected Behavior:**
- FCM permission is requested
- FCM token is generated and saved to user document
- Token is stored in `fcmTokens` array

## Debugging Common Issues

### 1. **Notifications Not Sending**
**Check:**
- FCM tokens are properly saved in user documents
- Cloud Functions are deployed and running
- Firebase project configuration is correct
- Console logs for error messages

**Debug Commands:**
```bash
# Check Cloud Function logs
firebase functions:log

# Check FCM token in user document
# Look for fcmTokens field in Firestore
```

### 2. **FCM Token Not Generated**
**Check:**
- Firebase configuration in `google-services.json`
- App permissions for notifications
- Device compatibility

**Debug Steps:**
```javascript
// Check FCM setup
import messaging from '@react-native-firebase/messaging';

const authStatus = await messaging().requestPermission();
console.log('FCM Auth Status:', authStatus);

const token = await messaging().getToken();
console.log('FCM Token:', token);
```

### 3. **Cloud Functions Not Triggering**
**Check:**
- Functions are properly deployed
- Firestore triggers are set up correctly
- Function logs for errors

**Deploy Functions:**
```bash
cd functions
npm install
firebase deploy --only functions
```

## Notification Flow Diagram

```
User Action → Service → Firestore → Cloud Function → Notification Service → Recipient
     ↓           ↓         ↓           ↓              ↓              ↓
  Follow    FollowService  Follow   sendFollow   FCM/Expo      User Device
  Message   ChatService    Message  sendMessage  Push          Notification
```

## Testing Checklist

- [ ] FCM tokens are generated and saved
- [ ] Follow notifications are sent to streamers
- [ ] Message notifications are sent to recipients
- [ ] Background notifications work properly
- [ ] Notification taps navigate to correct screens
- [ ] Both FCM and Expo tokens are handled
- [ ] Invalid tokens are cleaned up automatically

## Performance Considerations

1. **Token Management**: Tokens are automatically cleaned up when they fail
2. **Batch Processing**: Multiple notifications are sent in parallel
3. **Error Handling**: Failed notifications don't break the main functionality
4. **Background Processing**: Notifications are processed in the background

## Security Notes

1. **Authentication**: All Cloud Functions verify user authentication
2. **Data Validation**: Input data is validated before processing
3. **Token Security**: FCM tokens are stored securely in Firestore
4. **Access Control**: Only authorized users can trigger notifications

## Troubleshooting

### Common Error Messages

**"No FCM tokens found for user"**
- User hasn't granted notification permissions
- FCM setup failed during app initialization
- Token wasn't saved to user document

**"Cloud Function not found"**
- Functions not deployed
- Function name mismatch
- Firebase project configuration issue

**"Permission denied"**
- User hasn't granted notification permissions
- App doesn't have proper Firebase configuration

### Quick Fixes

1. **Restart the app** to reinitialize FCM
2. **Check Firebase console** for function deployment status
3. **Verify user permissions** in device settings
4. **Check network connectivity** for FCM registration

## Support

If you continue to experience issues:
1. Check the Firebase console for error logs
2. Verify all dependencies are properly installed
3. Ensure Firebase project configuration is correct
4. Test with a fresh app installation

## Next Steps

After successful setup:
1. Test with real devices (not just simulators)
2. Implement notification preferences
3. Add notification analytics
4. Optimize notification timing and frequency

