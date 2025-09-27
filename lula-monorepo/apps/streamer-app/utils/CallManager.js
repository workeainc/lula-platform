// CallManager.js
import { Alert } from 'react-native';
import { StreamVideoClient } from '@stream-io/video-react-native-sdk';
import BackendService from '../services/BackendService';
import { navigate } from '../navigations/RootNavigation';
import { 
    handleIncomingCallInstantly, 
    getOptimizedCallSettings,
    preloadCallResources 
} from './InstantCallUtils';

class CallManager {
    static instance;

    constructor(user) {
        if (CallManager.instance) {
            return CallManager.instance; // Ensure singleton instance
        }
        
        this.user = user;
        const token = this.tokenProvider.bind(this, user?.id)
        console.log('Stream Token:' ,token)
        
        // Get optimized settings for instant calls
        const optimizedSettings = getOptimizedCallSettings();
        
        this.client = new StreamVideoClient({
            apiKey: 'd9haf5vcbwwp',
            user,
            tokenProvider: token,
            options: {
                logger: (logLevel, message) => console.log(message),
                // Use optimized settings for instant call handling
                callSettings: optimizedSettings,
                // Additional client optimizations
                enableAudioProcessing: true,
                enableEchoCancellation: true,
                enableNoiseSuppression: true,
                enableAutomaticGainControl: true,
            },
        });

        this.setupCallListeners()
        this.preloadResources()
        CallManager.instance = this;
    }

    async tokenProvider(userId) {
        console.log(userId)
        try {
            // Get token from our Express.js backend instead of external service
            const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3002/api';
            const response = await fetch(`${API_BASE_URL}/stream/generate-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: userId }),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch token from backend');
            }

            const data = await response.json();
            return data.token;
        } catch (error) {
            console.error('Error generating token:', error);
            // Return null token for web compatibility
            console.warn('🌐 Web environment: Stream token generation failed, using null token');
            return null;
        }
    }

    setupCallListeners() {
        this.client.on('call.invited', (call) => {
            console.log('Incoming call:', call);

            // Use instant call handler
            handleIncomingCallInstantly(call, this.user);
        });

        // Add additional listeners for instant call handling
        this.client.on('call.accepted', (call) => {
            console.log('Call accepted instantly:', call.id);
        });

        this.client.on('call.rejected', (call) => {
            console.log('Call rejected instantly:', call.id);
        });

        this.client.on('call.ended', (call) => {
            console.log('Call ended instantly:', call.id);
        });

        this.client.on('call.updated', (call) => {
            console.log('Call updated instantly:', call.id);
        });

        // Handle call state changes instantly
        this.client.on('call.ringing', (call) => {
            console.log('Call ringing instantly:', call.id);
        });

        this.client.on('call.live', (call) => {
            console.log('Call live instantly:', call.id);
        });

        // Handle call errors instantly
        this.client.on('call.error', (error) => {
            console.error('Call error occurred:', error);
            // Handle error gracefully
        });
    }

    // Preload resources for instant response
    async preloadResources() {
        try {
            await preloadCallResources();
            console.log('Call resources preloaded successfully');
        } catch (error) {
            console.error('Error preloading call resources:', error);
        }
    }

    // Method to instantly end all active calls
    async endAllCalls() {
        try {
            const calls = this.client.call('default');
            if (calls && calls.state.callState !== 'idle') {
                await calls.endCall();
                console.log('All calls ended instantly');
            }
        } catch (error) {
            console.error('Error ending calls:', error);
        }
    }

    // Method to check if user is in a call
    isInCall() {
        try {
            const calls = this.client.call('default');
            return calls && calls.state.callState !== 'idle';
        } catch (error) {
            console.error('Error checking call state:', error);
            return false;
        }
    }

    // Method to get current call state
    getCurrentCallState() {
        try {
            const calls = this.client.call('default');
            return calls ? calls.state.callState : 'idle';
        } catch (error) {
            console.error('Error getting call state:', error);
            return 'idle';
        }
    }

    // Method to instantly mute/unmute audio
    async toggleAudioInstantly() {
        try {
            const calls = this.client.call('default');
            if (calls && calls.state.callState === 'live') {
                const isAudioEnabled = calls.state.localParticipant?.audio;
                if (isAudioEnabled) {
                    await calls.muteAudio();
                } else {
                    await calls.unmuteAudio();
                }
                console.log('Audio toggled instantly');
            }
        } catch (error) {
            console.error('Error toggling audio:', error);
        }
    }

    // Method to instantly mute/unmute video
    async toggleVideoInstantly() {
        try {
            const calls = this.client.call('default');
            if (calls && calls.state.callState === 'live') {
                const isVideoEnabled = calls.state.localParticipant?.video;
                if (isVideoEnabled) {
                    await calls.muteVideo();
                } else {
                    await calls.unmuteVideo();
                }
                console.log('Video toggled instantly');
            }
        } catch (error) {
            console.error('Error toggling video:', error);
        }
    }

    // Method to instantly switch camera
    async switchCameraInstantly() {
        try {
            const calls = this.client.call('default');
            if (calls && calls.state.callState === 'live') {
                await calls.switchCamera();
                console.log('Camera switched instantly');
            }
        } catch (error) {
            console.error('Error switching camera:', error);
        }
    }

    // Method to get call quality metrics
    getCallQualityMetrics() {
        try {
            const calls = this.client.call('default');
            if (calls && calls.state.callState === 'live') {
                return {
                    audioLevel: calls.state.localParticipant?.audioLevel || 0,
                    videoQuality: calls.state.localParticipant?.videoQuality || 'unknown',
                    connectionQuality: calls.state.connectionQuality || 'unknown',
                };
            }
            return null;
        } catch (error) {
            console.error('Error getting call quality metrics:', error);
            return null;
        }
    }

    getClient() {
        return this.client;
    }
}

export default CallManager;
