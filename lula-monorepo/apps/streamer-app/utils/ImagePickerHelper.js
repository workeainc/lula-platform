import { Platform } from 'react-native'
import * as ImagePicker from 'expo-image-picker'

// Conditionally import web image picker only on web platform
let launchWebProfileImagePicker, launchWebFullProfileImagePicker;
if (Platform.OS === 'web') {
    const WebImagePicker = require('./WebImagePicker');
    launchWebProfileImagePicker = WebImagePicker.launchWebProfileImagePicker;
    launchWebFullProfileImagePicker = WebImagePicker.launchWebFullProfileImagePicker;
}

export const launchImagePicker = async (options = {}) => {
    const defaultOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, // Enable editing/cropping
        aspect: [1, 1], // Default to square but allow customization
        quality: 0.9, // High quality but not maximum to balance size and quality
        allowsMultipleSelection: false,
        base64: false,
        exif: false,
    }

    const finalOptions = { ...defaultOptions, ...options }

    const result = await ImagePicker.launchImageLibraryAsync(finalOptions)

    if (!result.canceled) {
        return result.assets[0]
    }
}

// New function specifically for profile pictures with full image support
export const launchProfileImagePicker = async () => {
    // Use web-compatible image picker on web platform
    if (Platform.OS === 'web') {
        return await launchWebProfileImagePicker();
    }

    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Keep square for profile display but allow full image selection
        quality: 0.9,
        allowsMultipleSelection: false,
        base64: false,
        exif: false,
        // Allow larger images for better quality
        maxWidth: 2048,
        maxHeight: 2048,
    })

    if (!result.canceled) {
        return result.assets[0]
    }
}

// Function for high-quality profile images without editing constraints
export const launchFullProfileImagePicker = async () => {
    // Use web-compatible image picker on web platform
    if (Platform.OS === 'web') {
        return await launchWebFullProfileImagePicker();
    }

    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // No editing to preserve full image
        quality: 1, // Maximum quality
        allowsMultipleSelection: false,
        base64: false,
        exif: false,
        // Allow very high resolution images
        maxWidth: 4096,
        maxHeight: 4096,
    })

    if (!result.canceled) {
        return result.assets[0]
    }
}

// New function for completely unrestricted profile image upload
export const launchUnrestrictedProfileImagePicker = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // No editing/cropping at all
        quality: 1, // Maximum quality
        allowsMultipleSelection: false,
        base64: false,
        exif: false,
        // No size restrictions - let user upload any size image
        // maxWidth and maxHeight removed to allow unlimited dimensions
    })

    if (!result.canceled) {
        return result.assets[0]
    }
}

export const checkMediaPermissions = async () => {
    if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
        return status
    }

    return 'granted'
}
