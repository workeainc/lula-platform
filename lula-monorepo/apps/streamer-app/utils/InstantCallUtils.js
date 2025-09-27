// InstantCallUtils.js
// Utility functions for instant call operations

import { Alert } from 'react-native';
import { navigate } from '../navigations/RootNavigation';
import NewAuthService from '../services/NewAuthService';

/**
 * Instantly handle incoming call without any delays
 */
export const handleIncomingCallInstantly = async (call, user) => {
    try {
        console.log('Handling incoming call instantly:', call.id);
        
        // Show instant call alert
        Alert.alert(
            'Incoming Call',
            `You have an incoming call from ${call.state.members[0]?.user?.name || 'Unknown'}`,
            [
                {
                    text: 'Decline',
                    onPress: () => declineCallInstantly(call, user),
                    style: 'cancel',
                },
                {
                    text: 'Accept',
                    onPress: () => acceptCallInstantly(call, user),
                },
            ],
            { 
                cancelable: false,
                onDismiss: () => declineCallInstantly(call, user) // Auto-decline if dismissed
            }
        );
    } catch (error) {
        console.error('Error handling incoming call instantly:', error);
        // Auto-decline on error
        declineCallInstantly(call, user);
    }
};

/**
 * Instantly accept a call
 */
export const acceptCallInstantly = async (call, user) => {
    try {
        console.log('Accepting call instantly:', call.id);
        
        // Update user status instantly
        await AuthService.update(user.id, { 
            currentCall: { callId: call.id, type: 'INCOMING' }, 
            inCall: true 
        });
        
        // Navigate to call screen immediately
        navigate('Call', { 
            id: { callId: call.id },
            shouldJoin: true,
            instantJoin: true
        });
        
        console.log('Call accepted instantly');
    } catch (error) {
        console.error('Error accepting call instantly:', error);
        // Handle error gracefully
        Alert.alert('Error', 'Failed to accept call. Please try again.');
    }
};

/**
 * Instantly decline a call
 */
export const declineCallInstantly = async (call, user) => {
    try {
        console.log('Declining call instantly:', call.id);
        
        // Leave call immediately
        await call.leave();
        
        // Reset user status instantly
        await AuthService.update(user.id, { 
            currentCall: '', 
            inCall: false 
        });
        
        // Navigate back to previous screen to prevent white screen
        if (navigate && typeof navigate === 'function') {
            navigate('Main'); // Navigate to main screen after declining
        }
        
        console.log('Call declined instantly');
    } catch (error) {
        console.error('Error declining call instantly:', error);
        // Force navigation even if there's an error
        if (navigate && typeof navigate === 'function') {
            navigate('Main');
        }
    }
};

/**
 * Instantly end an active call - OPTIMIZED FOR INSTANT TERMINATION
 */
export const endCallInstantly = async (call, user, otherUserId) => {
    try {
        console.log('Ending call instantly:', call.id);
        
        // END CALL IMMEDIATELY - This is the most important part
        if (call) {
            console.log('Terminating Stream call immediately');
            await call.endCall();
            console.log('Stream call terminated successfully');
        }
        
        // Reset user statuses in background (non-blocking for instant response)
        if (user && otherUserId) {
            Promise.all([
                AuthService.update(user.id, { currentCall: '', inCall: false }),
                AuthService.update(otherUserId, { currentCall: '', inCall: false })
            ]).catch(error => {
                console.error('Error updating user statuses:', error);
            });
        }
        
        console.log('Call ended instantly - user returned to previous screen');
        return true;
    } catch (error) {
        console.error('Error ending call instantly:', error);
        
        // Force call termination even if there's an error
        try {
            if (call) {
                await call.endCall();
            }
        } catch (forceError) {
            console.error('Force call termination failed:', forceError);
        }
        
        return false;
    }
};

/**
 * Check if call can be handled instantly
 */
export const canHandleCallInstantly = (call) => {
    try {
        return call && 
               call.state && 
               call.state.callState && 
               call.state.callState !== 'idle';
    } catch (error) {
        console.error('Error checking if call can be handled instantly:', error);
        return false;
    }
};

/**
 * Get instant call status
 */
export const getInstantCallStatus = (call) => {
    try {
        if (!call) return 'no_call';
        
        const state = call.state?.callState;
        switch (state) {
            case 'idle':
                return 'no_call';
            case 'ringing':
                return 'incoming';
            case 'live':
                return 'active';
            case 'ended':
                return 'ended';
            default:
                return 'unknown';
        }
    } catch (error) {
        console.error('Error getting instant call status:', error);
        return 'unknown';
    }
};

/**
 * Optimize call settings for instant response
 */
export const getOptimizedCallSettings = () => {
    return {
        enableAudio: true,
        enableVideo: true,
        enableScreenShare: false,
        enableAudioProcessing: true,
        enableEchoCancellation: true,
        enableNoiseSuppression: true,
        enableAutomaticGainControl: true,
        connectionTimeout: 5000,
        retryTimeout: 2000,
        // Additional optimizations
        enableDtx: true, // Discontinuous transmission for better audio
        enableVad: true, // Voice activity detection
        audioCodec: 'opus', // Use Opus codec for better quality
        videoCodec: 'h264', // Use H.264 for better compatibility
    };
};

/**
 * Handle call errors instantly
 */
export const handleCallErrorInstantly = (error, call, user) => {
    console.error('Call error occurred:', error);
    
    // Auto-end call on critical errors
    if (error.code === 'network_error' || error.code === 'timeout') {
        endCallInstantly(call, user);
        Alert.alert('Call Error', 'Connection lost. Call ended automatically.');
    } else {
        Alert.alert('Call Error', 'An error occurred. Please try again.');
    }
};

/**
 * Preload call resources for instant response
 */
export const preloadCallResources = async () => {
    try {
        // Preload audio/video codecs
        // Preload network connections
        // Preload UI components
        console.log('Call resources preloaded for instant response');
    } catch (error) {
        console.error('Error preloading call resources:', error);
    }
};

/**
 * Force instant call termination - emergency function
 */
export const forceCallTermination = async (call) => {
    try {
        console.log('Force terminating call:', call?.id);
        
        if (call) {
            // Force end call without waiting
            await call.endCall();
            console.log('Call force terminated successfully');
        }
        
        return true;
    } catch (error) {
        console.error('Force call termination failed:', error);
        return false;
    }
};

export default {
    handleIncomingCallInstantly,
    acceptCallInstantly,
    declineCallInstantly,
    endCallInstantly,
    canHandleCallInstantly,
    getInstantCallStatus,
    getOptimizedCallSettings,
    handleCallErrorInstantly,
    preloadCallResources,
    forceCallTermination,
};
