import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState, useRef } from 'react'
import { DeviceEventEmitter } from 'react-native'
import notifee from '@notifee/react-native'
import { StreamVideo, useStreamVideoClient, CallingState, CallContent, StreamCall, useCallStateHooks } from '@stream-io/video-react-native-sdk'
import { useNavigation, useRoute } from '@react-navigation/native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import CallManager from '../utils/CallManager'
import AuthService from '../services/NewAuthService'
import CallService from '../services/NewCallService'
import CoinService from '../services/CoinService'
import WebSocketService from '../services/WebSocketService'
import { handleError } from '../utils/function'
import uuid from 'react-native-uuid'
import { useSelector } from 'react-redux'
import { callType } from '../constants/data'
import { LinearGradient } from 'expo-linear-gradient'
import InstantEndCallButton from '../components/ui/InstantEndCallButton'
import { MaterialIcons } from '@expo/vector-icons'
import RingtoneManager from '../utils/RingtoneManager'

const CallRoom = ({ call, endCall, exitToMain }) => {
    const { useCallCallingState, useParticipantCount } = useCallStateHooks()
    const callState = useCallCallingState()
    const count = useParticipantCount()
    const [isMuted, setIsMuted] = useState(false)

    useEffect(() => {
        if (callState === CallingState.LEFT) {
            console.log('Call ended from other side')
            endCall('completed')
            exitToMain()
        }
    }, [callState])

    // Remove waiting state - calls join instantly
    useEffect(() => {
        // No waiting state needed - calls are instant
    }, [count])

    useEffect(() => {
        try {
            const enabled = !!call?.state?.localParticipant?.audio
            setIsMuted(!enabled)
        } catch (_) {}
    }, [call])

    const toggleMute = async () => {
        try {
            const isAudioEnabled = !!call?.state?.localParticipant?.audio
            if (isAudioEnabled) {
                if (typeof call?.muteAudio === 'function') {
                    await call.muteAudio()
                } else if (call?.microphone?.setMuted) {
                    await call.microphone.setMuted(true)
                }
            } else {
                if (typeof call?.unmuteAudio === 'function') {
                    await call.unmuteAudio()
                } else if (call?.microphone?.setMuted) {
                    await call.microphone.setMuted(false)
                }
            }
            setIsMuted(!isAudioEnabled)
        } catch (error) {
            console.error('Error toggling mute:', error)
        }
    }

    const handleInstantEndCall = async () => {
        try {
            console.log('Instant end call triggered by user')

            // End call immediately without waiting
            if (call) {
                await call.endCall()
            }

            // Call endCall function to clean up
            await endCall('completed')

            // Stop any notification/foreground ringtone and cancel any call notification
            try { await RingtoneManager.stopAll(call?.id) } catch (_) {}
            try { await notifee.stopForegroundService() } catch (_) {}
            try { DeviceEventEmitter.emit('CALL_ENDED') } catch (_) {}
            // Also signal remote user by clearing both sides in backend (already done in endCall),
            // and rely on Stream's call.endCall propagation

            // Navigate back immediately
            exitToMain()
        } catch (error) {
            console.error('Error in instant end call:', error)
            // Force navigation back even if there's an error
            exitToMain()
        }
    }

    const handleEmergencyEndCall = () => {
        console.log('Emergency end call triggered')
        // Force end call and navigate back
        if (call) {
            call.endCall().catch(console.error)
        }
        endCall('emergency_ended')
        try { RingtoneManager.stopAll(call?.id) } catch (_) {}
        try { notifee.stopForegroundService() } catch (_) {}
        try { DeviceEventEmitter.emit('CALL_ENDED') } catch (_) {}
        exitToMain()
    }

    return (
        <View style={{ flex: 1 }}>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <CallContent
                    onHangupCallHandler={handleInstantEndCall}
                />

                {/* Additional instant end call button for emergency use */}
                <View style={styles.muteButtonContainer}>
                    <TouchableOpacity onPress={toggleMute} style={styles.muteButton}>
                        <MaterialIcons name={isMuted ? 'mic-off' : 'mic'} size={22} color="#fff" />
                        <Text style={{ color: '#fff', marginLeft: 8 }}>{isMuted ? 'Unmute' : 'Mute'}</Text>
                    </TouchableOpacity>
                </View>
            </GestureHandlerRootView>
        </View>
    )
}

const CallComponent = () => {
    const { user } = useSelector((state) => state.auth)
    const navigation = useNavigation()
    const {
        params: { userId, id, callId, end, shouldJoin },
    } = useRoute()
    const client = useStreamVideoClient()
    const [call, setCall] = useState(null)
    const [slug, setSlug] = useState(null)
    const callLogIdRef = useRef(null)
    const callStartTimeRef = useRef(null)
    

    // Centralized safe exit to avoid double back leading to white screen
    const exitToMain = () => {
        if (navigation.canGoBack()) {
            navigation.goBack()
        } else {
            navigation.reset({ index: 0, routes: [{ name: 'Main' }] })
        }
    }

    console.log('Call params:', { userId, id, callId, end, shouldJoin });

    const handleCall = async (callId) => {
        try {
            const res = await AuthService.getUser(userId)
            console.log(res)

            if (res?.user?.currentCall) {
                return { error: true, message: 'User Already on another Call!' }
            }

            // Fetch recipient's data to get their push tokens
            const recipientDataRes = await AuthService.getUser(userId);
            const recipientFCMToken = recipientDataRes?.user?.fcmTokens || recipientDataRes?.user?.fcmToken;
            const recipientExpoToken = recipientDataRes?.user?.expoPushToken;

            // Fetch caller's data to get their name
            const callerDataRes = await AuthService.getUser(user.id);
            const callerName = callerDataRes?.user?.name;

            // Instant call setup - no delays
            await Promise.all([
                // For receiver, include caller info so backend function can notify properly
                AuthService.update(userId, { currentCall: { callId, type: callType.INCOMING, callerId: user.id, callerName: callerName || '' }, inCall: true }),
                AuthService.update(user?.id, { currentCall: { callId, type: callType.OUTGOING }, inCall: true }),
            ])

            // // Prefer Expo Push for reliable background display; also send FCM if available
            // const hasExpo = !!recipientExpoToken;
            // const hasFcm = !!recipientFCMToken;
            // console.log('Call notify tokens availability:', { hasExpo, hasFcm, hasCallerName: !!callerName });
            // let sentAny = false;
            // if (recipientExpoToken) {
            //     await sendExpoPushNotification(recipientExpoToken, {
            //         title: `Incoming Call: ${callerName || 'Someone'}`,
            //         body: `${callerName || 'Someone'} is calling...`,
            //         data: { type: 'call', callId, callerId: user.id, callerName: callerName || '' },
            //         sound: 'default',
            //         channelId: 'incoming_calls_v2',
            //         priority: 'high',
            //     });
            //     sentAny = true;
            // }
            // // Only send FCM if Expo token is unavailable
            // if (!sentAny && recipientFCMToken && callerName) {
            //     await sendFCMNotificationViaBackend(recipientFCMToken, callId, callerName, user.id);
            //     sentAny = true;
            // }
            // if (!sentAny) {
            //     console.warn('Could not send notification: Missing recipient tokens or caller name');
            // }

            // Add call log entry when call is initiated
            const startTime = Date.now()
            callStartTimeRef.current = startTime
            const logRes = await CallService.addCallLog({
                callerId: user.id,
                receiverId: userId,
                startTime: startTime,
                status: 'ongoing',
            })
            if (!logRes.error) {
                callLogIdRef.current = logRes.data
            } else {
                console.error('Failed to add initial call log:', logRes.message)
            }

            return { error: false, message: 'Call Created!' }
        } catch (error) {
            handleError(error)
        }
    }

    const sendFCMNotificationViaBackend = async (token, callId, callerName, callerId) => {
        try {
            const response = await fetch('https://lula-fcm-notification.vercel.app/api/send-notification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: token,
                    // Include notification so Android shows it when app is background/terminated
                    notification: {
                        title: `Incoming Call: ${callerName}`,
                        body: `${callerName} is calling...`,
                    },
                    android: {
                        priority: 'high',
                        notification: {
                            channel_id: 'incoming_calls_v2',
                            sound: 'my_awesome_ringtone',
                            default_sound: true,
                            default_vibrate_timings: true,
                            visibility: 'PUBLIC',
                            sticky: true,
                        },
                    },
                    data: {
                        type: 'call',
                        callId: callId,
                        callerName: callerName,
                        callerId: callerId,
                        click_action: 'FLUTTER_NOTIFICATION_CLICK',
                    },
                }),
            });

            const result = await response.text();
            console.log('Backend response for FCM notification:', result);

        } catch (error) {
            console.error('Error calling backend for FCM notification:', error);
        }
    }

    const sendExpoPushNotification = async (to, { title, body, data = {}, sound = 'default', channelId, priority } = {}) => {
        try {
            const message = { to, sound, title, body, data };
            if (channelId) message.channelId = channelId;
            if (priority) message.priority = priority;
            const res = await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Accept-encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(message),
            });
            try {
                const json = await res.json();
                if (json?.errors?.length) {
                    console.warn('Expo push errors:', json.errors);
                }
            } catch (_) {}
        } catch (error) {
            console.error('Error sending Expo push notification:', error);
        }
    }

    const endCall = async (status = 'completed') => {
        console.log('Ending call instantly with status:', status)

        try {
            // End Stream call FIRST - this is the most important for instant termination
            if (call) {
                console.log('Ending Stream call immediately')
                await call.endCall()
                console.log('Stream call ended successfully')
            }

            // Update call log entry when call ends (non-blocking)
            if (callLogIdRef.current) {
                const endTime = Date.now()
                const duration = callStartTimeRef.current ? Math.max(0, Math.floor((endTime - callStartTimeRef.current) / 1000)) : 0
                console.log('Call duration:', duration)

                // Don't wait for this - do it in background
                CallService.updateCallLog(callLogIdRef.current, {
                    endTime: endTime,
                    duration: duration,
                    status: status,
                }).catch(error => {
                    console.error('Error updating call log:', error)
                })

                callLogIdRef.current = null
                callStartTimeRef.current = null
            }

            // Reset user statuses (non-blocking for instant response)
            Promise.all([
                AuthService.update(userId, { currentCall: '', inCall: false }),
                AuthService.update(user.id, { currentCall: '', inCall: false }),
            ]).catch(error => {
                console.error('Error updating user statuses:', error)
            })

            console.log('Call ended instantly - all cleanup completed')

            // Ensure all ringtones/notifications are silenced
            try { await RingtoneManager.stopAll(call?.id) } catch (_) {}
            try { await notifee.stopForegroundService() } catch (_) {}
            try { DeviceEventEmitter.emit('CALL_ENDED') } catch (_) {}

        } catch (error) {
            console.error('Error in endCall:', error)
            // Even if there's an error, try to clean up
            try {
                if (call) {
                    await call.endCall()
                }
            } catch (cleanupError) {
                console.error('Error in cleanup:', cleanupError)
            }
            // Best-effort ringtone/notification stop on error
            try { await RingtoneManager.stopAll(call?.id) } catch (_) {}
            try { await notifee.stopForegroundService() } catch (_) {}
            try { DeviceEventEmitter.emit('CALL_ENDED') } catch (_) {}
        }
    }

    useEffect(() => {
        const joinOrCreateCall = async () => {
            let slug
            const incomingSlug = id?.callId?.toString?.() || callId?.toString?.()
            if (incomingSlug) {
                slug = incomingSlug
                const _call = client.call('default', slug)

                if (end) {
                    // Instant call ending
                    console.log('Instant call ending triggered')
                    await _call.endCall()
                    await endCall('ended_by_receiver')
                    try { await RingtoneManager.stopAll(slug) } catch (_) {}
                    try { await notifee.stopForegroundService() } catch (_) {}
                    try { DeviceEventEmitter.emit('CALL_ENDED') } catch (_) {}
                    exitToMain()
                    return
                }

                // Check if we should immediately join (from notification acceptance)
                if (shouldJoin) {
                    console.log('Instant join flow triggered');
                    try {
                        // Ensure call exists in case of race; create if missing
                        await _call.join({ create: true });
                        setCall(_call);
                        // Stop any pending ringtones when we join
                        try { await RingtoneManager.stopAll(slug) } catch (_) {}
                        try { await notifee.stopForegroundService() } catch (_) {}
                        setSlug(slug);
                        return;
                    } catch (error) {
                        console.error('Error joining call with create:true, trying fallback:', error);
                        try {
                            await _call.getOrCreate();
                            await _call.join({ create: false });
                            setCall(_call);
                            // Stop any pending ringtones when we join
                            try { await RingtoneManager.stopAll(slug) } catch (_) {}
                            try { await notifee.stopForegroundService() } catch (_) {}
                            setSlug(slug);
                            return;
                        } catch (fallbackErr) {
                            console.error('Fallback join failed:', fallbackErr);
                            endCall('failed');
                            exitToMain();
                        }
                    }
                }

                // Instant join flow - ensure call exists to avoid race
                try {
                    await _call.join({ create: true });
                    setCall(_call);
                    // Stop any pending ringtones when we join
                    try { await RingtoneManager.stopAll(slug) } catch (_) {}
                    try { await notifee.stopForegroundService() } catch (_) {}
                    setSlug(slug);
                    // Ensure when remote ends, we clean locally
                    _call.on('call.ended', () => {
                        endCall('ended');
                        try { DeviceEventEmitter.emit('CALL_ENDED') } catch (_) {}
                        exitToMain();
                    });
                } catch (error) {
                    console.error('Error joining call with create:true, trying fallback:', error);
                    try {
                        await _call.getOrCreate();
                        await _call.join({ create: false });
                        setCall(_call);
                        // Stop any pending ringtones when we join
                        try { await RingtoneManager.stopAll(slug) } catch (_) {}
                        try { await notifee.stopForegroundService() } catch (_) {}
                        setSlug(slug);
                        _call.on('call.ended', () => {
                            endCall('ended');
                            try { DeviceEventEmitter.emit('CALL_ENDED') } catch (_) {}
                            exitToMain();
                        });
                    } catch (fallbackErr) {
                        console.error('Fallback join failed:', fallbackErr);
                        endCall('failed');
                        exitToMain();
                    }
                }
            } else {
                // Outgoing call: create and join immediately; rely on participant count for UI state
                slug = uuid.v4()
                const res = await handleCall(slug)
                if (res.error) {
                    showToast(res.message, 'info')
                    exitToMain()
                    return
                }
                const _call = client.call('default', slug)

                try {
                    await _call.getOrCreate()
                    await _call.join({ create: false })
                    setCall(_call)
                    // Stop any pending ringtones when we join
                    try { await RingtoneManager.stopAll(slug) } catch (_) {}
                    try { await notifee.stopForegroundService() } catch (_) {}
                    setSlug(slug)

                    // Ensure when remote ends, we clean locally
                    _call.on('call.ended', () => {
                        endCall('ended');
                        try { DeviceEventEmitter.emit('CALL_ENDED') } catch (_) {}
                        exitToMain();
                    })
                } catch (error) {
                    console.error('Error creating/joining call:', error)
                    showToast('Failed to start the call', 'error')
                    endCall('failed_to_create')
                    exitToMain()
                }
            }
        }
        joinOrCreateCall()

        return () => {
            // Cleanup on unmount - instant cleanup
            if (call?.state.callState !== CallingState.LEFT) {
                console.log('Component unmounting - ending call')
                call?.endCall()
                endCall('completed')
            }
            // Always make sure ringtone/notification are silenced on unmount
            try { RingtoneManager.stopAll(slug) } catch (_) {}
            try { notifee.stopForegroundService() } catch (_) {}
            try { DeviceEventEmitter.emit('CALL_ENDED') } catch (_) {}
            // Ensure navigation back to prevent white screen
            exitToMain()
        }
    }, [client, id, callId])

    if (end) {
        return null
    }

    if (!call || !slug) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size={'large'} />
                <Text style={{ marginTop: 10, textAlign: 'center' }}>Connecting call...</Text>
                <TouchableOpacity onPress={() => {
                    endCall('cancelled')
                    exitToMain()
                }}>
                    <LinearGradient colors={['#CE54C1', 'rgba(97, 86, 226, 0.9)']} style={styles.sendButton2}>
                        <Text className="text-white">End Call</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        )
    }

    // Removed separate waiting UI; we now join immediately and rely on Stream UI

    return (
        <StreamCall call={call}>
            <CallRoom call={call} endCall={endCall} exitToMain={exitToMain} />
        </StreamCall>
    )
}

const CallScreen = () => {
    const client = CallManager.instance?.getClient()

    if (!client) {
        return null
    }

    return (
        <StreamVideo client={client}>
            <CallComponent />
        </StreamVideo>
    )
}

export default CallScreen

const styles = StyleSheet.create({
    sendButton: {
        padding: 10,
        marginTop: 10,
        width: '100%',
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButton2: {
        padding: 10,
        marginTop: 10,
        width: 200,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emergencyEndButtonContainer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        alignItems: 'center',
    },
    emergencyEndButton: {
        width: '100%',
    },
    muteButtonContainer: {
        position: 'absolute',
        bottom: 24,
        left: 24,
        right: 24,
        alignItems: 'flex-start',
    },
    muteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 20,
    },
})
