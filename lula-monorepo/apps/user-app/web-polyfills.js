// Web polyfills for React Native modules
// This file provides web-compatible implementations for React Native modules

export const PermissionsAndroid = {
  PERMISSIONS: {
    CAMERA: 'android.permission.CAMERA',
    RECORD_AUDIO: 'android.permission.RECORD_AUDIO',
    WRITE_EXTERNAL_STORAGE: 'android.permission.WRITE_EXTERNAL_STORAGE',
    READ_EXTERNAL_STORAGE: 'android.permission.READ_EXTERNAL_STORAGE',
  },
  RESULTS: {
    GRANTED: 'granted',
    DENIED: 'denied',
    NEVER_ASK_AGAIN: 'never_ask_again',
  },
  request: async (permission) => {
    // On web, we'll assume permissions are granted
    return 'granted';
  },
  requestMultiple: async (permissions) => {
    // On web, we'll assume all permissions are granted
    const results = {};
    permissions.forEach(permission => {
      results[permission] = 'granted';
    });
    return results;
  },
  check: async (permission) => {
    // On web, we'll assume permissions are granted
    return true;
  },
};

// WebRTC polyfill for @stream-io/react-native-webrtc
export const RTCView = () => null;
export const MediaStream = () => null;
export const MediaStreamTrack = () => null;
export const RTCPeerConnection = () => null;
export const RTCSessionDescription = () => null;
export const RTCIceCandidate = () => null;

// Default export for @stream-io/react-native-webrtc
export default {
  PermissionsAndroid,
  RTCView,
  MediaStream,
  MediaStreamTrack,
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
};
