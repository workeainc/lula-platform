import notifee from '@notifee/react-native';

// Handle background events (call this in your App.js)
export function setupNotifeeBackgroundHandler() {
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    const { notification, pressAction } = detail;
    
    if (type === EventType.ACTION_PRESS) {
      if (pressAction.id === 'accept') {
        // Handle call acceptance
        console.log('Call accepted', notification.data);
      } else if (pressAction.id === 'decline') {
        // Handle call rejection
        console.log('Call declined', notification.data);
      }
    }
  });
}