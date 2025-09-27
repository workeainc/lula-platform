// import * as Device from 'expo-device'
// import * as Notifications from 'expo-notifications'
// import Constants from 'expo-constants'
// import { Platform } from 'react-native'

// COMMENTED OUT TO PREVENT DUPLICATE NOTIFICATIONS
// Notifee is now handling all notifications in App.js
// Notifications.setNotificationHandler({
//     handleNotification: async () => ({
//         shouldShowAlert: true,
//         shouldPlaySound: false,
//         shouldSetBadge: false,
//     }),
// })

function handleRegistrationError(errorMessage) {
    console.error(errorMessage)
    throw new Error(errorMessage)
}

export async function registerForPushNotificationsAsync() {
    console.log('⚠️ Expo notifications disabled - using Notifee instead')
    console.log('Start Token getting')
    
    // Return null to prevent expo notifications from working
    // Notifee will handle all notifications
    return null

    // COMMENTED OUT TO PREVENT DUPLICATE NOTIFICATIONS
    // if (Platform.OS === 'android') {
    //     Notifications.setNotificationChannelAsync('default', {
    //         name: 'default',
    //         importance: Notifications.AndroidImportance.MAX,
    //         vibrationPattern: [0, 250, 250, 250],
    //         lightColor: '#FF231F7C',
    //     })
    // }

    // // if (Device.isDevice) {
    // const { status: existingStatus } = await Notifications.getPermissionsAsync()
    // console.log('Existing status', existingStatus)

    // let finalStatus = existingStatus
    // if (existingStatus !== 'granted') {
    //     const { status } = await Notifications.requestPermissionsAsync()
    //     finalStatus = status
    // }
    // if (finalStatus !== 'granted') {
    //     handleRegistrationError('Permission not granted to get push token for push notification!')
    //     return
    // }
    // const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId
    // if (!projectId) {
    //     handleRegistrationError('Project ID not found')
    // }
    // try {
    //     const pushTokenString = (
    //         await Notifications.getExpoPushTokenAsync({
    //             projectId,
    //         })
    //     ).data

    //     return pushTokenString
    // } catch (e) {
    //     handleRegistrationError(`${e}`)
    // }
    // // } else {
    // //     handleRegistrationError('Must use physical device for push notifications')
    // // }
}

export async function sendPushNotification(expoPushToken) {
    console.log('⚠️ Expo push notifications disabled - using Notifee instead')
    
    // Return early to prevent expo notifications from working
    // Notifee will handle all notifications
    return

    // COMMENTED OUT TO PREVENT DUPLICATE NOTIFICATIONS
    // const message = {
    //     to: expoPushToken,
    //     sound: 'default',
    //     title: 'Original Title',
    //     body: 'And here is the body!',
    //     data: { someData: 'goes here' },
    // }

    // await fetch('https://exp.host/--/api/v2/push/send', {
    //     method: 'POST',
    //     headers: {
    //         Accept: 'application/json',
    //         'Accept-encoding': 'gzip, deflate',
    //         'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify(message),
    // })
}
