import React, { useState, useEffect } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import Entypo from '@expo/vector-icons/Entypo';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector } from 'react-redux'; // Import useSelector
import NewAuthService from '../services/NewAuthService'; // Import NewAuthService
import showToast from '../utils/toast'; // Assuming you have a toast utility
import { launchProfileImagePicker, launchFullProfileImagePicker, launchUnrestrictedProfileImagePicker } from '../utils/ImagePickerHelper';

const EditProfile = () => {
    const navigation = useNavigation();
    const { user } = useSelector((state) => state.auth); // Get user from Redux state

    // State for storing profile details
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [profileImage, setProfileImage] = useState(''); // Initialize with empty string
    const [loading, setLoading] = useState(true); // Add loading state
    const [imageKey, setImageKey] = useState(0); // Add key to force image refresh

    useEffect(() => {
        // Fetch user data and initialize state
        const fetchUserData = async () => {
            if (user && user.id) {
                try {
                    // You might already have the full user object in Redux,
                    // but fetching it again here ensures you have the latest data.
                    const res = await NewAuthService.getCurrentUser();
                    if (!res.error) {
                        const userData = res.user;
                        setName(userData.name || ''); // Use empty string if data is null/undefined
                        setEmail(userData.email || '');
                        setPhone(userData.phoneNumber || ''); // Assuming phone is stored as phoneNumber
                        setAddress(userData.address || '');
                        setProfileImage(userData.profileUri || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQPTf60mv3VeYXJg37aEFDqWIzA8DNhRnU02w&s'); // Default image if none
                    } else {
                        showToast(res.message || 'Failed to fetch user data');
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                    showToast('An error occurred while fetching user data');
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
                // Handle case where user is not available (e.g., not logged in)
                showToast('User not found. Please log in again.');
                // Optionally navigate back to login
                // navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
            }
        };

        fetchUserData();
    }, [user]); // Refetch if user object in Redux changes

    // Enhanced image picker handler with options
    const handleImagePicker = () => {
        Alert.alert(
            'Choose Profile Picture',
            'Select how you want to upload your profile picture',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Standard Quality (Square Crop)',
                    onPress: () => handleStandardImagePicker(),
                },
                {
                    text: 'High Quality (Full Image)',
                    onPress: () => handleHighQualityImagePicker(),
                },
                {
                    text: 'Upload Full Image (No Restrictions)',
                    onPress: () => handleUnrestrictedImagePicker(),
                },
            ]
        );
    };

    // Standard quality image picker (with editing)
    const handleStandardImagePicker = () => {
        launchProfileImagePicker().then((selectedImage) => {
            if (selectedImage && selectedImage.uri) {
                setProfileImage(selectedImage.uri);
                console.log('Standard quality image selected:', selectedImage.uri);
            }
        }).catch((error) => {
            console.error('Standard image picker error:', error);
            showToast('Failed to pick image. Please try again.');
        });
    };

    // High quality image picker (without editing to preserve full image)
    const handleHighQualityImagePicker = () => {
        launchFullProfileImagePicker().then((selectedImage) => {
            if (selectedImage && selectedImage.uri) {
                setProfileImage(selectedImage.uri);
                console.log('High quality image selected:', selectedImage.uri);
                showToast('High quality image selected! It will be displayed as a profile picture.', 'success');
            }
        }).catch((error) => {
            console.error('High quality image picker error:', error);
            showToast('Failed to pick image. Please try again.');
        });
    };

    // Unrestricted image picker (no editing, no size restrictions)
    const handleUnrestrictedImagePicker = () => {
        launchUnrestrictedProfileImagePicker().then((selectedImage) => {
            if (selectedImage && selectedImage.uri) {
                setProfileImage(selectedImage.uri);
                console.log('Unrestricted image selected:', selectedImage.uri);
                showToast('Full image uploaded successfully! Your complete image will be used as profile picture.', 'success');
            }
        }).catch((error) => {
            console.error('Unrestricted image picker error:', error);
            showToast('Failed to pick image. Please try again.');
        });
    };

    // Legacy image picker for backward compatibility
    const handleLegacyImagePicker = () => {
        launchImageLibrary(
            {
                mediaType: 'photo',
                quality: 0.8,
                includeBase64: false,
                maxWidth: 1024,
                maxHeight: 1024,
            },
            (response) => {
                if (response.didCancel) {
                    console.log('User cancelled image picker');
                } else if (response.errorCode) {
                    console.error('Image picker error: ', response.errorCode);
                    showToast('Failed to pick image. Please try again.');
                } else if (response.assets && response.assets[0]) {
                    const selectedImage = response.assets[0];
                    console.log('Image selected:', selectedImage);
                    
                    // Check if the image has a valid URI
                    if (selectedImage.uri) {
                        setProfileImage(selectedImage.uri);
                        console.log('Profile image set to:', selectedImage.uri);
                    } else {
                        console.error('Selected image has no URI');
                        showToast('Invalid image selected. Please try again.');
                    }
                }
            }
        );
    };

    const handleSaveChanges = async () => {
        setLoading(true);
        
        // Add a timeout to prevent loading state from getting stuck
        const timeoutId = setTimeout(() => {
            setLoading(false);
            showToast('Operation timed out. Please try again.');
        }, 30000); // 30 seconds timeout
        
        try {
            if (user && user.id) {
                // Validate required fields
                if (!name || typeof name !== 'string' || !name.trim()) {
                    showToast('Name is required');
                    setLoading(false);
                    return;
                }

                let profileUri = user.profileUri || ''; // Keep existing profile URI by default
                
                // If a new image was selected, upload it first
                if (profileImage && typeof profileImage === 'string' && profileImage.trim() !== '' && profileImage !== user.profileUri) {
                    try {
                        console.log('Starting image upload for:', profileImage);
                        
                        // Upload the new image and get the URI
                        const uploadResult = await NewAuthService.uploadProfileImage(profileImage);
                        
                        // Check if upload was successful
                        if (uploadResult && uploadResult.error) {
                            console.error('Image upload failed:', uploadResult);
                            showToast(`Failed to upload image: ${uploadResult.message}`);
                            setLoading(false);
                            return;
                        }
                        
                        // If upload was successful, update the profileUri
                        profileUri = uploadResult;
                        console.log('Image uploaded successfully. New profileUri:', profileUri);
                        
                        // Update the local state to show the new image immediately
                        setProfileImage(profileUri);
                        setImageKey(prev => prev + 1); // Force image refresh
                        
                        console.log('Image uploaded successfully!');
                    } catch (uploadError) {
                        console.error('Error uploading image:', uploadError);
                        showToast('Failed to upload image. Please try again.');
                        setLoading(false);
                        return;
                    }
                }

                // Validate that profileUri is a valid URL if it's not empty
                if (profileUri && typeof profileUri === 'string' && profileUri.trim() !== '' && !profileUri.startsWith('http')) {
                    console.error('Invalid profileUri:', profileUri);
                    showToast('Invalid profile image URL. Please try selecting the image again.');
                    setLoading(false);
                    return;
                }

                const updatedUserData = {
                    name: name.trim(),
                    email: email && typeof email === 'string' ? email.trim() : '',
                    address: address && typeof address === 'string' ? address.trim() : '',
                    profileUri: profileUri, // Use the correct field name
                };

                console.log('Updating profile with data:', updatedUserData);
                const res = await NewAuthService.updateProfile(user.id, updatedUserData);

                if (!res.error) {
                    console.log('Profile updated successfully:', res);
                    
                    // Force a refresh of the profile data
                    if (user && user.id) {
                        try {
                            const refreshRes = await NewAuthService.getCurrentUser();
                            if (!refreshRes.error) {
                                console.log('Refreshed user data:', refreshRes.user);
                                // Update local state with fresh data
                                setName(refreshRes.user.name || '');
                                setEmail(refreshRes.user.email || '');
                                setAddress(refreshRes.user.address || '');
                                setProfileImage(refreshRes.user.profileUri || '');
                                setImageKey(prev => prev + 1); // Force image refresh
                            }
                        } catch (refreshError) {
                            console.error('Failed to refresh user data:', refreshError);
                        }
                    }
                    
                    showToast('Profile updated successfully!', 'success');
                    navigation.goBack();
                } else {
                    console.error('Profile update failed:', res);
                    showToast(res.message || 'Failed to update profile');
                }
            } else {
                showToast('User not found. Please log in again.');
            }
        } catch (error) {
            console.error('Error saving profile changes:', error);
            showToast('An error occurred while saving profile changes');
        } finally {
            clearTimeout(timeoutId);
            setLoading(false);
        }
    };


    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text>Loading profile data...</Text>
            </View>
        );
    }


    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.header} className={'mb-5'}>
                <Text style={styles.mediumText} className={'text-center'}>Edit Profile</Text>
            </View>
            <View style={styles.profileImageContainer}>
                <Image
                    key={imageKey}
                    source={
                        profileImage && 
                        typeof profileImage === 'string' && 
                        profileImage.trim() !== '' && 
                        (profileImage.startsWith('http') || profileImage.startsWith('file://'))
                            ? { uri: profileImage }
                            : require('../assets/images/avatar.png')
                    }
                    style={styles.profileImage}
                    onError={(error) => {
                        console.error('Image loading error:', error);
                        setProfileImage(''); // Reset to default on error
                    }}
                />
                <TouchableOpacity onPress={handleImagePicker}>
                    <LinearGradient
                        colors={['#CE54C1', 'rgba(97, 86, 226, 0.9)' ]}
                        style={styles.changeImageButton}
                    >
                        <Entypo name="camera" size={20} color="white" />
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
            />

            <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
            />

            <TextInput
                style={[styles.input, { backgroundColor: '#f0f0f0' }]}
                value={phone}
                placeholder="Phone Number"
                editable={false} // Phone number is likely not editable
            />

            <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
                placeholder="Enter your address"
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges}>
                <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#fff',
        padding: 16,
    },
    loadingContainer: { // Style for loading indicator
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileImageContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    profileImage: {
        width: 150,
        height: 150,
        borderRadius: 200,
        marginBottom: 10,
        resizeMode: 'cover', // Ensure image covers the entire area properly
        // Add shadow for better visual appeal
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    changeImageButton: {
        borderRadius: 200,
        width: 40,
        height: 40,
        marginTop: -33,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    changeImageButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    input: {
        height: 50,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        marginBottom: 12,
        paddingLeft: 10,
        fontSize: 16,
    },
    saveButton: {
        backgroundColor: 'rgba(97, 86, 226, 0.9)',
        paddingVertical: 12,
        marginTop: 30,
        alignItems: 'center',
        borderRadius: 40,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
    },
    mediumText: {
        fontSize: 18,
        fontWeight: '600',
    },
});

export default EditProfile;
