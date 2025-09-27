import { StyleSheet, Text, View, Image, TouchableOpacity, Alert } from 'react-native'
import React, { useState, useEffect } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { useSelector } from 'react-redux'
import { useNavigation } from '@react-navigation/native'
import NewChatService from '../../services/NewChatService'
import showToast from '../../utils/toast'
import { handleError } from '../../utils/function'
import Ionicons from '@expo/vector-icons/Ionicons';
import BackendService from '../../services/BackendService'
import NewAuthService from '../../services/NewAuthService'
import CallService from '../../services/NewCallService'
import CoinService from '../../services/CoinService'

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

    const [userBalance, setUserBalance] = useState(0);
    const [isCheckingBalance, setIsCheckingBalance] = useState(false);

    const navigation = useNavigation()

    // Load user balance on component mount
    useEffect(() => {
        loadUserBalance();
    }, []);

    const loadUserBalance = async () => {
        try {
            const result = await CoinService.getBalance(user.id);
            if (!result.error) {
                setUserBalance(result.data.balance);
            }
        } catch (error) {
            console.error('Failed to load user balance:', error);
        }
    };

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

    // Updated call handler with balance validation
    const handleCall = async (callType = 'video') => {
        try {
            if (!item?.id) {
                showToast('Invalid user data');
                return;
            }

            setIsCheckingBalance(true);

            // Check balance before initiating call
            const balanceCheck = await CoinService.validateCallBalance(user.id, callType);
            
            if (!balanceCheck.canMakeCall) {
                setIsCheckingBalance(false);
                
                // Show recharge option
                Alert.alert(
                    'Insufficient Balance',
                    balanceCheck.message,
                    [
                        {
                            text: 'Cancel',
                            style: 'cancel'
                        },
                        {
                            text: 'Recharge',
                            onPress: () => navigation.navigate('Plans')
                        }
                    ]
                );
                return;
            }

            // Initiate call
            const callResult = await CallService.initiateCall(user.id, item.id, callType);
            
            if (callResult.error) {
                setIsCheckingBalance(false);
                if (callResult.insufficientBalance) {
                    Alert.alert(
                        'Insufficient Balance',
                        callResult.message,
                        [
                            {
                                text: 'Cancel',
                                style: 'cancel'
                            },
                            {
                                text: 'Recharge',
                                onPress: () => navigation.navigate('Plans')
                            }
                        ]
                    );
                } else {
                    showToast(callResult.message);
                }
                return;
            }

            setIsCheckingBalance(false);
            
            // Navigate to call screen
            navigation.navigate('Call', { 
                userId: item.id,
                callId: callResult.call.id,
                callType: callType,
                streamCallId: callResult.call.streamCallId
            });

        } catch (error) {
            setIsCheckingBalance(false);
            handleError(error);
        }
    }

    // Voice call handler
    const handleVoiceCall = () => {
        handleCall('voice');
    }

    // Video call handler
    const handleVideoCall = () => {
        handleCall('video');
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
                />
                
                {/* Online status indicator */}
                {item.isOnline && (
                    <View style={styles.onlineIndicator} />
                )}
            </View>

            <View style={styles.userInfo}>
                <Text style={styles.userName}>
                    {item.name || item.phoneNumber || 'Unknown User'}
                </Text>
                
                {/* User balance display */}
                <View style={styles.balanceContainer}>
                    <Ionicons name="coin" size={16} color="#FFD700" />
                    <Text style={styles.balanceText}>
                        {userBalance} coins
                    </Text>
                </View>

                {/* Age and location */}
                <View style={styles.userDetails}>
                    {item.age && (
                        <Text style={styles.userDetail}>
                            {item.age} years
                        </Text>
                    )}
                    {item.location && (
                        <Text style={styles.userDetail}>
                            📍 {item.location.address || 'Location available'}
                        </Text>
                    )}
                </View>

                {/* Action buttons */}
                <View style={styles.actionButtons}>
                    {/* Voice Call Button */}
                    <TouchableOpacity 
                        style={[styles.actionButton, styles.voiceCallButton]}
                        onPress={handleVoiceCall}
                        disabled={isCheckingBalance}
                    >
                        <LinearGradient
                            colors={['#4CAF50', '#45a049']}
                            style={styles.buttonGradient}
                        >
                            <Ionicons 
                                name="call" 
                                size={20} 
                                color="white" 
                            />
                            <Text style={styles.buttonText}>Voice</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Video Call Button */}
                    <TouchableOpacity 
                        style={[styles.actionButton, styles.videoCallButton]}
                        onPress={handleVideoCall}
                        disabled={isCheckingBalance}
                    >
                        <LinearGradient
                            colors={['#2196F3', '#1976D2']}
                            style={styles.buttonGradient}
                        >
                            <Ionicons 
                                name="videocam" 
                                size={20} 
                                color="white" 
                            />
                            <Text style={styles.buttonText}>Video</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Chat Button */}
                    <TouchableOpacity 
                        style={[styles.actionButton, styles.chatButton]}
                        onPress={handleChat}
                    >
                        <LinearGradient
                            colors={['#FF9800', '#F57C00']}
                            style={styles.buttonGradient}
                        >
                            <Ionicons 
                                name="chatbubble" 
                                size={20} 
                                color="white" 
                            />
                            <Text style={styles.buttonText}>Chat</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Follow Button */}
                    <TouchableOpacity 
                        style={[styles.actionButton, styles.followButton]}
                        onPress={handleFollow}
                    >
                        <LinearGradient
                            colors={follow ? ['#9E9E9E', '#757575'] : ['#E91E63', '#C2185B']}
                            style={styles.buttonGradient}
                        >
                            <Ionicons 
                                name={follow ? "checkmark" : "add"} 
                                size={20} 
                                color="white" 
                            />
                            <Text style={styles.buttonText}>
                                {follow ? 'Following' : 'Follow'}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* Call rate information */}
                <View style={styles.callRateInfo}>
                    <Text style={styles.rateText}>
                        💰 Voice: ₹49/min • Video: ₹49/min
                    </Text>
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    cardContainer: {
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 15,
        marginVertical: 8,
        marginHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginRight: 15,
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 5,
        right: 20,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#4CAF50',
        borderWidth: 2,
        borderColor: 'white',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    balanceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    balanceText: {
        fontSize: 14,
        color: '#FFD700',
        fontWeight: '600',
        marginLeft: 4,
    },
    userDetails: {
        marginBottom: 12,
    },
    userDetail: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    actionButton: {
        flex: 1,
        marginHorizontal: 2,
    },
    buttonGradient: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
    },
    voiceCallButton: {
        // Additional styles if needed
    },
    videoCallButton: {
        // Additional styles if needed
    },
    chatButton: {
        // Additional styles if needed
    },
    followButton: {
        // Additional styles if needed
    },
    callRateInfo: {
        alignItems: 'center',
        marginTop: 4,
    },
    rateText: {
        fontSize: 10,
        color: '#666',
        textAlign: 'center',
    },
});

export default UserCard;
