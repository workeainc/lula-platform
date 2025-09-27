import Toast from 'react-native-toast-message'

export default function showToast(message, type = 'error') {
    Toast.show({
        type,
        text1: type === 'error' ? 'Error' : type === 'success' ? 'Success' : 'Warning',
        text2: message,
    })
}
