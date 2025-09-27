import { Alert } from 'react-native'
import moment from 'moment'
import showToast from './toast'

export function handleError(error) {
    console.log(error)
    // Ensure the message passed to showToast is a string
    const errorMessage = typeof error.message === 'string' ? error.message : 'An unexpected error occurred';
    showToast(errorMessage);
}

export function stringFormater(value = '', count = 40) {
    if (typeof value !== 'string') {
        return ''
    }

    if (value.length <= count) {
        return value
    }
    return `${value.slice(0, count)}...`
}

export const displayConfirmation = (callback) => {
    Alert.alert(
        'Warning',
        'Are you sure ?',
        [
            {
                text: 'Cancel',
                onPress: () => console.log('cancelled'),
                style: 'cancel',
            },
            {
                text: 'Confirm',
                onPress: () => callback(),
            },
        ],
        { cancelable: true }
    )
}

export const checkExpiry = (date) => {
    if (!date) {
        return false
    }

    const expiryDate = new Date(date)
    const today = new Date()

    expiryDate.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)
    console.log(moment(expiryDate).isAfter(today))

    return moment(expiryDate).isAfter(today)
}

export function showHiddenEmail(email) {
    if (!email) {
        return undefined
    }
    // Split the email into username and domain parts
    const parts = email.split('@')
    const username = parts[0]
    const domain = parts[1]

    // Determine the length of the username
    const usernameLength = username.length

    // Display the first two characters of the username followed by asterisks
    const displayedUsername = username.substring(0, 4) + '*'.repeat(usernameLength - 4)

    // Reveal the full domain
    const displayedDomain = domain

    // Return the displayed email
    return `${displayedUsername}@${displayedDomain}`
}

export function formatPrice(price, currency = 'USD') {
    return parseFloat(price).toLocaleString('en-US', { style: 'currency', currency: currency })
}

export function generateOtp(length = 6) {
    const template = '0123456789' // Template for the OTP characters
    let otp = '' // Initialize an empty string for the OTP

    for (let i = 0; i < length; i++) {
        // Randomly select a character from the template and append it to the OTP
        otp += template.charAt(Math.floor(Math.random() * template.length))
    }

    return otp // Return the generated OTP
}

export function formatDate(date, format = 'hh:mm A') {
    if (!date) {
        return ''
    }

    // Normalize Firestore Timestamp or other inputs to a JS Date/ISO string when possible
    const normalized = typeof date?.toDate === 'function' ? date.toDate() : date
    return moment(normalized).format(format)
}
