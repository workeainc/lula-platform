# Firebase Functions Deployment Guide for Lula Streamer App

## Issue Identified
The streamer app was missing Firebase Cloud Functions to handle message notifications. When streamers send messages to users, the `sendMessageNotification` function was not deployed, causing notifications to fail.

## What Was Fixed

### 1. Added Missing Notification Function
- **File**: `lula-streamer/functions/index.js`
- **Function**: `sendMessageNotification`
- **Trigger**: Firestore document creation in `chats/{chatId}/messages/{messageId}`

### 2. Enhanced Message Structure
- **File**: `lula-streamer/services/ChatService.js`
- **Improvement**: Added proper logging and ensured message data includes required fields
- **Fields**: `sender: 'STREAMER'`, `senderId`, `createdAt`, `updatedAt`

### 3. Created Firebase Configuration Files
- **package.json**: Dependencies for Firebase functions
- **firebase.json**: Functions configuration
- **.firebaserc**: Project configuration

## Deployment Steps

### Prerequisites
1. Install Firebase CLI globally:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

### Deploy Functions

1. Navigate to the streamer app directory:
   ```bash
   cd lula-streamer
   ```

2. Install dependencies:
   ```bash
   cd functions
   npm install
   cd ..
   ```

3. Deploy the functions:
   ```bash
   firebase deploy --only functions
   ```

### Verify Deployment

1. Check Firebase Console > Functions
2. Verify `sendMessageNotification` function is deployed
3. Check function logs for any errors

## How It Works

### Message Flow
1. **Streamer sends message** → `ChatService.sendMessage()`
2. **Message saved to Firestore** → `chats/{chatId}/messages/{messageId}`
3. **Cloud Function triggers** → `sendMessageNotification`
4. **Function determines recipient** → User (if sender is STREAMER)
5. **Notification sent** → Expo push token for user app

### Notification Logic
```javascript
if (messageData.sender === 'STREAMER') {
    // Message from streamer to user - notify user
    recipientId = userId;
    recipientType = 'USER';
} else {
    // Message from user to streamer - notify streamer
    recipientId = streamerId;
    recipientType = 'STREAMER';
}
```

## Testing

### 1. Send Test Message
- Open streamer app
- Send a message to a user
- Check Firebase function logs

### 2. Verify Notification
- Check user app receives notification
- Verify notification content and actions

### 3. Debug Issues
- Check Firebase function logs
- Verify message structure in Firestore
- Ensure user has valid Expo push token

## Common Issues & Solutions

### Issue: Function not triggering
**Solution**: Verify function is deployed and check Firestore rules

### Issue: No tokens found
**Solution**: Ensure user has `expoPushToken` field in their document

### Issue: Notification not received
**Solution**: Check Expo push token validity and app notification permissions

## Monitoring

### Firebase Function Logs
```bash
firebase functions:log --only sendMessageNotification
```

### Real-time Monitoring
- Firebase Console > Functions > Logs
- Check for errors and execution times

## Security Considerations

- Functions run with admin privileges
- Ensure proper Firestore security rules
- Validate message data before processing
- Rate limiting for notification sending

## Next Steps

1. Deploy the functions
2. Test message sending
3. Monitor function performance
4. Add additional notification types if needed
