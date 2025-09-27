import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Image,
    SafeAreaView,
    StatusBar,
    Platform,
    Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import notifee from '@notifee/react-native';
import { Audio } from 'expo-av';
import { DeviceEventEmitter } from 'react-native';
import RingtoneManager from '../utils/RingtoneManager';
import NewAuthService from '../services/NewAuthService';
import CallManager from '../utils/CallManager';
import { callType } from '../constants/data';

const { width, height } = Dimensions.get('window');

const ReceiveCall = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { user } = useSelector((state) => state.auth);
    const [callData, setCallData] = useState(null);
    const [isRinging, setIsRinging] = useState(true);
    
    // Safe back navigation to avoid GO_BACK warning when no history exists
    const safeExit = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
        }
    };
    
    // Animation refs for ringing effect
    const ring1Anim = useRef(new Animated.Value(0)).current;
    const ring2Anim = useRef(new Animated.Value(0)).current;
    const ring3Anim = useRef(new Animated.Value(0)).current;
    
    // Ringtone ref
    const ringtoneRef = useRef(null);

    // Ringtone functions
    const playRingtone = async () => {
        try {
            // If a call notification is already displayed (with OS ringtone), avoid starting in-app ringtone
            try {
                const displayed = await notifee.getDisplayedNotifications();
                const callId = route?.params?.callId;
                const hasCallNotification = displayed.some(n => (
                    (n?.id || '').startsWith('call_') || (n?.data?.type || '').toString().toLowerCase() === 'call'
                ) && (!callId || n.id === `call_${callId}`));
                if (hasCallNotification) {
                    console.log('🔇 [ReceiveCall] Skipping in-app ringtone; OS notification ringtone active');
                    return;
                }
            } catch (_) {}

            // Start single-instance in-app ringtone
            await RingtoneManager.start();
            console.log('🔊 [ReceiveCall] Ringtone started (singleton)');
        } catch (error) {
            console.error('❌ [ReceiveCall] Error playing ringtone:', error);
        }
    };

    const stopRingtone = async () => {
        try {
            await RingtoneManager.stopAll(route?.params?.callId);
            if (ringtoneRef.current) {
                try { await ringtoneRef.current.stopAsync(); } catch (_) {}
                try { await ringtoneRef.current.unloadAsync(); } catch (_) {}
                ringtoneRef.current = null;
            }
            console.log('🔇 [ReceiveCall] Ringtone stopped (singleton + notifee)');
        } catch (error) {
            console.error('❌ [ReceiveCall] Error stopping ringtone:', error);
        }
    };

    // Get call data from route params
    useEffect(() => {
        if (route.params) {
            const { callId, callerName, callerId, callerImage, isIncoming } = route.params;
            console.log('🔥 [ReceiveCall] Call data received:', route.params);
            
            setCallData({ callId, callerName, callerId, callerImage, isIncoming });
            
            // Start ringtone for incoming calls
            if (isIncoming) {
                playRingtone();
            }
        }
    }, [route.params]);

    // Cleanup ringtone on unmount
    useEffect(() => {
        return () => {
            stopRingtone();
        };
    }, []);

    // Start ringing animation
    useEffect(() => {
        if (isRinging) {
            const createRingAnimation = (animValue, delay = 0) => {
                return Animated.loop(
                    Animated.sequence([
                        Animated.delay(delay),
                        Animated.timing(animValue, {
                            toValue: 1,
                            duration: 1500,
                            useNativeDriver: true,
                        }),
                        Animated.timing(animValue, {
                            toValue: 0,
                            duration: 0,
                            useNativeDriver: true,
                        }),
                    ])
                );
            };

            const ring1Animation = createRingAnimation(ring1Anim, 0);
            const ring2Animation = createRingAnimation(ring2Anim, 500);
            const ring3Animation = createRingAnimation(ring3Anim, 1000);

            ring1Animation.start();
            ring2Animation.start();
            ring3Animation.start();

            return () => {
                ring1Animation.stop();
                ring2Animation.stop();
                ring3Animation.stop();
            };
        }
    }, [isRinging]);

    const handleAcceptCall = async () => {
        try {
            console.log('🔥 [ReceiveCall] Accepting call:', callData);
            setIsRinging(false);
            
            // Stop ringtone immediately
            await stopRingtone();
            // Broadcast to stop any system/notification ringtone
            DeviceEventEmitter.emit('CALL_ACCEPTED');
            
            // Update call status to accepted
            if (callData?.callId && user?.id) {
                await NewAuthService.updateProfile(user.id, { 
                    currentCall: { 
                        ...callData, 
                        type: callType.ONGOING 
                    }, 
                    inCall: true 
                });
            }
            
            // Cancel any notifications
            if (callData?.callId) {
                try {
                    await notifee.cancelNotification(`call_${callData.callId}`);
                } catch (error) {
                    console.log('No notification to cancel');
                }
            }
            
            // Navigate to actual call screen
            navigation.replace('Call', { 
                callId: callData?.callId,
                userId: callData?.callerId,
                callerName: callData?.callerName,
                shouldJoin: true,
                isIncoming: true,
                instantJoin: true
            });
        } catch (error) {
            console.error('❌ [ReceiveCall] Error accepting call:', error);
        }
    };

    const handleDeclineCall = async () => {
        try {
            console.log('🔥 [ReceiveCall] Declining call:', callData);
            setIsRinging(false);
            
            // Stop ringtone immediately
            await stopRingtone();
            // Broadcast to stop any system/notification ringtone
            DeviceEventEmitter.emit('CALL_DECLINED');
            
            // Proactively end Stream call if exists so the user app receives end signal
            try {
                const client = CallManager.instance?.getClient();
                if (client && callData?.callId) {
                    const call = client.call('default', callData.callId.toString());
                    await call.endCall();
                    console.log('🔚 [ReceiveCall] Stream call ended before acceptance');
                }
            } catch (e) {
                console.log('⚠️ [ReceiveCall] Failed to end Stream call pre-join:', e?.message || e);
            }
            
            // Update call status to declined/clear for both users
            const updates = [];
            if (user?.id) {
                updates.push(NewAuthService.updateProfile(user.id, { 
                    currentCall: null, 
                    inCall: false 
                }));
            }
            if (callData?.callerId) {
                updates.push(NewAuthService.updateProfile(callData.callerId, { 
                    currentCall: null, 
                    inCall: false 
                }));
            }
            
            // Execute all updates
            if (updates.length > 0) {
                await Promise.all(updates);
                console.log('🔥 [ReceiveCall] Call declined - cleared for both users');
            }
            
            // Cancel the notification
            if (callData?.callId) {
                try {
                    await notifee.cancelNotification(`call_${callData.callId}`);
                } catch (error) {
                    console.log('No notification to cancel');
                }
            }
            
            // Navigate back
            safeExit();
        } catch (error) {
            console.error('❌ [ReceiveCall] Error declining call:', error);
            safeExit();
        }
    };

    const handleMessage = async () => {
        try {
            console.log('🔥 [ReceiveCall] Opening chat with:', callData?.callerId);
            
            // Stop ringtone when opening chat
            await stopRingtone();
            // Navigate to chat screen
            if (callData?.callerId) {
                navigation.replace('Chat', { 
                    chatId: `chat_${callData.callerId}`,
                    streamerId: callData.callerId,
                    streamerName: callData.callerName
                });
            }
        } catch (error) {
            console.error('❌ [ReceiveCall] Error opening chat:', error);
        }
    };

    if (!callData) {
        return (
            <SafeAreaView style={styles.container}>
                <LinearGradient
                    colors={['#1e156eff', '#0a0066ff']}
                    style={styles.gradient}
                >
                    <View style={styles.callerInfo}>
                        <Text style={styles.callerName}>Loading call...</Text>
                    </View>
                </LinearGradient>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar 
                barStyle="light-content" 
                backgroundColor="transparent" 
                translucent 
            />
            
            <LinearGradient
                colors={['#1e156eff', '#0a0066ff']}
                style={styles.gradient}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerText}>Incoming Call</Text>
                </View>

                {/* Caller Info */}
                <View style={styles.callerInfo}>
                    <View style={styles.avatarContainer}>
                        <Image
                            source={
                                callData.callerImage 
                                    ? { uri: callData.callerImage }
                                    : require('../assets/images/avatar.png')
                            }
                            style={styles.avatar}
                        />
                        {isRinging && (
                            <View style={styles.ringingIndicator}>
                                <Animated.View 
                                    style={[
                                        styles.ring, 
                                        styles.ring1,
                                        {
                                            opacity: ring1Anim,
                                            transform: [{
                                                scale: ring1Anim.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [1, 1.3]
                                                })
                                            }]
                                        }
                                    ]} 
                                />
                                <Animated.View 
                                    style={[
                                        styles.ring, 
                                        styles.ring2,
                                        {
                                            opacity: ring2Anim,
                                            transform: [{
                                                scale: ring2Anim.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [1, 1.3]
                                                })
                                            }]
                                        }
                                    ]} 
                                />
                                <Animated.View 
                                    style={[
                                        styles.ring, 
                                        styles.ring3,
                                        {
                                            opacity: ring3Anim,
                                            transform: [{
                                                scale: ring3Anim.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [1, 1.3]
                                                })
                                            }]
                                        }
                                    ]} 
                                />
                            </View>
                        )}
                    </View>
                    
                    <Text style={styles.callerName}>{callData.callerName || 'Unknown Caller'}</Text>
                    <Text style={styles.callStatus}>Incoming call...</Text>
                </View>

                {/* Call Actions */}
                <View style={styles.actionsContainer}>
                    {/* Accept Call Button */}
                    <TouchableOpacity
                        style={styles.acceptButton}
                        onPress={handleAcceptCall}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#4CAF50', '#45a049']}
                            style={styles.acceptButtonGradient}
                        >
                            <Ionicons name="call" size={32} color="white" />
                        </LinearGradient>
                        <Text style={styles.buttonText}>Accept</Text>
                    </TouchableOpacity>

                    {/* Decline Call Button */}
                    <TouchableOpacity
                        style={styles.declineButton}
                        onPress={handleDeclineCall}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#f44336', '#d32f2f']}
                            style={styles.declineButtonGradient}
                        >
                            <Ionicons name="call" size={32} color="white" />
                        </LinearGradient>
                        <Text style={styles.buttonText}>Decline</Text>
                    </TouchableOpacity>
                </View>

                {/* Message Button */}
                <TouchableOpacity
                    style={styles.messageButton}
                    onPress={handleMessage}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={['#2196F3', '#1976D2']}
                        style={styles.messageButtonGradient}
                    >
                        <Ionicons name="chatbubble" size={24} color="white" />
                        <Text style={styles.messageButtonText}>Message</Text>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Bottom Info */}
                <View style={styles.bottomInfo}>
                    <Text style={styles.bottomText}>Tap to answer or decline</Text>
                </View>
            </LinearGradient>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1e156eff',
    },
    gradient: {
        flex: 1,
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'android' ? 50 : 0,
        paddingBottom: 50,
    },
    header: {
        alignItems: 'center',
        paddingTop: 20,
    },
    headerText: {
        fontSize: 18,
        color: 'white',
        fontWeight: '600',
        opacity: 0.9,
    },
    callerInfo: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 30,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    ringingIndicator: {
        position: 'absolute',
        top: -10,
        left: -10,
        right: -10,
        bottom: -10,
    },
    ring: {
        position: 'absolute',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 70,
        width: 140,
        height: 140,
        top: -10,
        left: -10,
    },
    ring1: {
        // Base styles for ring 1
    },
    ring2: {
        // Base styles for ring 2
    },
    ring3: {
        // Base styles for ring 3
    },
    callerName: {
        fontSize: 28,
        color: 'white',
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    callStatus: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
    },
    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 40,
        marginBottom: 40,
    },
    acceptButton: {
        alignItems: 'center',
    },
    acceptButtonGradient: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    declineButton: {
        alignItems: 'center',
    },
    declineButtonGradient: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        shadowColor: '#f44336',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    messageButton: {
        alignItems: 'center',
        marginBottom: 30,
    },
    messageButtonGradient: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
        alignItems: 'center',
        shadowColor: '#2196F3',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    messageButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    bottomInfo: {
        alignItems: 'center',
    },
    bottomText: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 14,
    },
});

export default ReceiveCall;
