import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { useSelector } from 'react-redux'
import { useNavigation } from '@react-navigation/native'
import NewChatService from '../../services/NewChatService'
import showToast from '../../utils/toast'
import { handleError } from '../../utils/function'
import Ionicons from '@expo/vector-icons/Ionicons';
import BackendService from '../../services/BackendService'
import NewAuthService from '../../services/NewAuthService'

const UserCard = ({ item }) => {
    // Safety check for item
    if (!item) {
        return null;
    }
    
    const { user } = useSelector((state) => state.auth)
    // Safety check for user
    if (!user || !user.id) {
        return null;
    }
    
    const [follow, setFollow] = useState(
        item?.followers && 
        Array.isArray(item.followers) && 
        item.followers.includes(user.id) 
            ? true 
            : false
    )

    const navigation = useNavigation()

    const handleChat = async () => {
        try {
            if (!item?.id) {
                showToast('Invalid user data');
                return;
            }
            const res = await ChatService.createChat(item.id, user.id)
            if (!res.error) {
                navigation.navigate('Chat', { chatId: res.data })
            } else {
                showToast(res.message)
            }
        } catch (error) {
            handleError(error)
        }
    }

    const handleFollow = async () => {
        try {
            if (!item?.id) {
                showToast('Invalid user data');
                return;
            }
            if (follow) {
                setFollow(false)
                await FollowService.unfollowUser(user.id, item.id)
            } else {
                setFollow(true)
                await FollowService.followUser(user.id, item.id)
            }
        } catch (error) {
            handleError(error)
        }
    }

    const handleCall = async (userId) => {
        try {
            if (!item?.id) {
                showToast('Invalid user data');
                return;
            }
            const res = await AuthService.getUser(item.id);
            if (res.error) {
                throw new Error(res.message)
            }
            navigation.navigate('Call', { userId })
        } catch (error) {
            handleError(error)
        }
    }

    return (
        <View style={styles.cardContainer}>
            <View className="relative">
                <Image 
                    source={
                        item.profileUri && 
                        typeof item.profileUri === 'string' && 
                        item.profileUri.trim() !== '' 
                            ? { uri: item.profileUri } 
                            : require('../../assets/images/avatar.png')
                    } 
                    style={styles.profileImage}
                    onError={() => {
                        // Fallback to default avatar if image fails to load
                        console.log('Failed to load profile image for user:', item.id);
                    }}
                    defaultSource={require('../../assets/images/avatar.png')}
                    resizeMode="cover"
                />
                <View style={[styles.statusIndicator, { backgroundColor: item?.statusShow ? '#4CAF50' : '#B0BEC5' }]} />
            </View>
            <View style={styles.textContainer}>
                <View style={styles.headerRow}>
                    <Text selectable={true} style={styles.userName}>{item?.name || 'Anonymous User'}</Text>
                </View>
                <View style={styles.buttonContainer}>
                    <TouchableOpacity onPress={handleFollow} style={styles.button}>
                        <LinearGradient 
                            colors={follow ? ['#757575', '#616161'] : ['#57A10D', '#4B8E0B']} 
                            style={styles.gradientButton}
                        >
                            <Text style={styles.buttonText}>{follow ? 'Unfollow' : 'Follow'}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleChat} style={styles.button}>
                        <LinearGradient 
                            colors={['#CE54C1', '#6156E2']} 
                            style={styles.gradientButton}
                        >
                            <Text style={styles.buttonText}>Chat Now</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
            <TouchableOpacity onPress={() => handleCall(item?.id)} style={styles.callButtonContainer}>
                <LinearGradient colors={['#CE54C1', '#6156E2']} style={styles.callButton}>
                    <Ionicons name="call-sharp" size={20} color="white" />
                </LinearGradient>
            </TouchableOpacity>
        </View>
    )
}

export default UserCard

const styles = StyleSheet.create({
    cardContainer: {
        flexDirection: 'row',
        marginHorizontal: 12,
        marginVertical: 8,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    profileImage: {
        width: 70,
        height: 70,
        borderRadius: 35,
        borderWidth: 2,
        borderColor: '#EEE',
    },
    textContainer: {
        flex: 1,
        marginLeft: 12,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    userName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    statusIndicator: {
        width: 14,
        height: 14,
        borderRadius: 35,
        zIndex: 10,
        position: 'absolute',
        right: 0,
        bottom: 0,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    gradientButton: {
        width: 75,
        paddingVertical: 3,
        borderRadius: 5,
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '500',
    },
    callButtonContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    callButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
})