import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Modal, Text, TouchableOpacity, View, Dimensions, AppState, DeviceEventEmitter } from 'react-native';
import { useSelector } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import NewAuthService from '../../services/NewAuthService';
import { navigate } from '../../navigations/RootNavigation';
import { callType } from '../../constants/data';
import { Audio } from 'expo-av';
import CallManager from '../../utils/CallManager';
import RingtoneManager from '../../utils/RingtoneManager';

const { height } = Dimensions.get('window');

const CallWrapper = ({ children }) => {
    const { user } = useSelector((state) => state.auth);
    const [currentCall, setCurrentCall] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const ringtoneRef = useRef(null);
    const appState = useRef(AppState.currentState);

    const playRingtone = async () => {
        try {
            const { sound } = await Audio.Sound.createAsync(
                require('../../assets/audio/iphone_15.mp3'),
                { isLooping: true }
            );
            ringtoneRef.current = sound;
            await sound.playAsync();
        } catch (error) {
            console.error('Error playing ringtone:', error);
        }
    };

    const stopRingtone = async () => {
        // Only stop the local wrapper sound; do not broadcast global stop here
        if (ringtoneRef.current) {
            try { await ringtoneRef.current.stopAsync(); } catch (_) {}
            try { await ringtoneRef.current.unloadAsync(); } catch (_) {}
            ringtoneRef.current = null;
        }
    };

    useEffect(() => {
        if (!user) return;

        const handleAppStateChange = (nextAppState) => {
            console.log('🔄 [CallWrapper] App state changed:', { from: appState.current, to: nextAppState });
            
            if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
                console.log('🔄 [CallWrapper] App coming to foreground, rechecking for calls...');
                
                // Stop any playing ringtone (if any)
                stopRingtone();
                
                // Recheck for any pending calls when coming to foreground
                NewAuthService.getUser(user.id).then((result) => {
                    console.log('🔄 [CallWrapper] User data on foreground:', result);
                    
                    if (result && !result.error && result.user?.currentCall) {
                        console.log('🔥 [CallWrapper] Found pending call on foreground:', result.user.currentCall);
                        
                        const pendingCall = result.user.currentCall;
                        if (pendingCall.type === callType.INCOMING) {
                            console.log('🔥 [CallWrapper] Navigating to ReceiveCall for pending call');
                            setCurrentCall(pendingCall);
                            navigate('ReceiveCall', { 
                                callId: pendingCall.callId,
                                callerName: pendingCall.callerName || 'Unknown',
                                callerId: pendingCall.callerId,
                                callerImage: pendingCall.callerImage || null,
                                isIncoming: true
                            });
                        }
                    } else {
                        console.log('🔄 [CallWrapper] No pending calls found');
                        // Clear any existing call state if no current call
                        if (currentCall && !result.user?.currentCall) {
                            console.log('🔄 [CallWrapper] Clearing stale call state');
                            setCurrentCall(null);
                            setModalVisible(false);
                            // Ensure any ringtones are silenced if remote ended while we were backgrounded
                            stopRingtone();
                        }
                    }
                }).catch(error => {
                    console.error('❌ [CallWrapper] Error rechecking calls on foreground:', error);
                });
            }
            
            appState.current = nextAppState;
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        let unsubscribe = null;
        let isMounted = true;

            // Use async pattern like lula-user for better error handling
            (async () => {
                try {
                    const fn = NewAuthService.listenUserId(user.id, (data) => {
                    if (!isMounted) return;
                    
                    console.log('🔥 [CallWrapper] Firestore listener triggered:', { 
                        currentCall: data?.currentCall, 
                        type: data?.currentCall?.type,
                        callId: data?.currentCall?.callId,
                        callerName: data?.currentCall?.callerName,
                        timestamp: new Date().toISOString()
                    });
                    
                    setCurrentCall((prevCall) => {
                // If call was accepted from notification, skip showing modal
                if (data?.currentCall?.type === callType.INCOMING && 
                    prevCall?.callId !== data.currentCall.callId) {
                    
                    console.log('🔥 [CallWrapper] Incoming call detected!', {
                        callId: data.currentCall.callId,
                        callerName: data.currentCall.callerName,
                        appState: appState.current
                    });
                    
                    // Check if app is in background (call was accepted via notification)
                    if (appState.current === 'background') {
                        console.log('🔥 [CallWrapper] App in background, skipping modal');
                        return data.currentCall;
                    }
                    
                    // Navigate directly to ReceiveCall screen instead of showing modal
                    console.log('🔥 [CallWrapper] Navigating directly to ReceiveCall screen');
                    navigate('ReceiveCall', { 
                        callId: data.currentCall.callId,
                        callerName: data.currentCall.callerName || 'Unknown',
                        callerId: data.currentCall.callerId,
                        callerImage: data.currentCall.callerImage || null,
                        isIncoming: true
                    });
                    
                    return data.currentCall;
                }
                
                if (!data.currentCall && prevCall) {
                    setModalVisible(false);
                    // Stop any playing ringtone (singleton + local)
                    try { RingtoneManager.stopAll(prevCall.callId); } catch (_) {}
                    stopRingtone();
                    try { DeviceEventEmitter.emit('CALL_ENDED'); } catch (_) {}
                    return null;
                }
                
                return prevCall;
            });
        });
        unsubscribe = fn;
    } catch (error) {
        console.error('❌ [CallWrapper] Error setting up call listener:', error);
    }
})();

        return () => {
            isMounted = false;
            subscription.remove();
            if (unsubscribe) unsubscribe();
            stopRingtone();
        };
    }, [user]);

    const handleAccept = () => {
        // This should not be called anymore since we navigate directly to ReceiveCall
        console.log('⚠️ [CallWrapper] handleAccept called - this should not happen');
        setModalVisible(false);
        stopRingtone();
    };

    const handleDecline = async () => {
        // This should not be called anymore since we navigate directly to ReceiveCall
        console.log('⚠️ [CallWrapper] handleDecline called - this should not happen');
        setModalVisible(false);
        try { await RingtoneManager.stopAll(currentCall?.callId); } catch (_) {}
        await stopRingtone();
        
        // Proactively end Stream call so the user app sees end immediately
        try {
            const client = CallManager.instance?.getClient();
            if (client && currentCall?.callId) {
                const call = client.call('default', currentCall.callId.toString());
                await call.endCall();
                console.log('🔚 [CallWrapper] Stream call ended from wrapper decline');
            }
        } catch (e) {
            console.log('⚠️ [CallWrapper] Failed to end Stream call from wrapper:', e?.message || e);
        }

        // Update call status to declined
        if (currentCall?.callId && user?.id) {
            NewAuthService.update(user.id, { currentCall: null, inCall: false });
        }
    };

    return (
        <>
            {children}

            <Modal transparent animationType="fade" visible={modalVisible}>
                <View style={styles.modalContainer}>
                    <LinearGradient colors={['rgba(97, 86, 226, 1)', 'rgba(171, 73, 161, 1)', 'rgba(171, 73, 161, 1)', 'rgba(171, 73, 161, 1)']} style={styles.gradientContainer}>
                        <View style={styles.contentContainer}>
                            <Text style={styles.mobileText}>Lula</Text>
                            <Text style={styles.callerName}>Incoming Call</Text>

                            <View style={styles.actionsContainer}>
                                <View style={styles.mainActions}>
                                    <TouchableOpacity 
                                        style={[styles.mainActionButton, styles.declineButton]} 
                                        onPress={handleDecline}
                                        activeOpacity={0.7} // Instant response
                                    >
                                        <Ionicons name="call" size={32} color="white" />
                                    </TouchableOpacity>

                                    <TouchableOpacity 
                                        style={[styles.mainActionButton, styles.acceptButton]} 
                                        onPress={handleAccept}
                                        activeOpacity={0.7} // Instant response
                                    >
                                        <Ionicons name="call" size={32} color="white" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </LinearGradient>
                </View>
            </Modal>
        </>
    )
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    gradientContainer: {
        flex: 1,
        justifyContent: 'space-between',
    },
    contentContainer: {
        flex: 1,
        alignItems: 'center',
        paddingTop: height * 0.1,
    },
    mobileText: {
        color: '#eee',
        fontSize: 16,
        marginBottom: 8,
    },
    callerName: {
        color: 'white',
        fontSize: 36,
        fontWeight: '500',
        marginBottom: height * 0.08,
    },
    actionsContainer: {
        position: 'absolute',
        bottom: 50,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 40,
    },
    secondaryAction: {
        alignItems: 'center',
    },
    actionButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    actionText: {
        color: 'white',
        fontSize: 14,
    },
    mainActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 30,
    },
    mainActionButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    declineButton: {
        backgroundColor: '#FF3B30',
        transform: [{ rotate: '135deg' }],
    },
    acceptButton: {
        backgroundColor: '#34C759',
    },
})

export default CallWrapper
