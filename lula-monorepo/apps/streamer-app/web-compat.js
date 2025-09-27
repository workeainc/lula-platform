// Web compatibility stub for React Native modules that don't work in web environment
import React from 'react';
import { View, Text } from 'react-native';

// Platform polyfill for web environment
export const Platform = {
  OS: 'web',
  select: (options) => options.web || options.default,
  Version: 'web',
  constants: {},
  isPad: false,
  isTVOS: false,
  isTV: false,
  isTesting: false,
};

// Stub for requireNativeComponent
export const requireNativeComponent = (name) => {
  console.warn(`requireNativeComponent('${name}') called in web environment - returning stub component`);
  return React.forwardRef((props, ref) => (
    <View {...props} ref={ref} style={[props.style, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', minHeight: 200 }]}>
      <Text style={{ color: 'white', textAlign: 'center' }}>📹 {name}{'\n'}(Web Stub)</Text>
    </View>
  ));
};

// Specific RTCVideoView component stub
export const RTCVideoView = React.forwardRef((props, ref) => (
  <View {...props} ref={ref} style={[props.style, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', minHeight: 200 }]}>
    <Text style={{ color: 'white', textAlign: 'center' }}>📹 Video Stream{'\n'}(Web Environment)</Text>
  </View>
));

// Stub for WebRTC components
export const RTCView = React.forwardRef((props, ref) => (
  <View {...props} ref={ref} style={[props.style, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
    <Text style={{ color: 'white' }}>Video Stream (Web)</Text>
  </View>
));

// MediaStream stub
export const MediaStream = class MediaStream {
  constructor() {
    this.id = 'web-stub-stream';
  }
};

// RTCPeerConnection stub
export const RTCPeerConnection = class RTCPeerConnection {
  constructor() {
    this.localDescription = null;
    this.remoteDescription = null;
  }
  
  async createOffer() { return {}; }
  async createAnswer() { return {}; }
  async setLocalDescription() {}
  async setRemoteDescription() {}
  addTrack() {}
  removeTrack() {}
  close() {}
};

// MediaDevices stub
export const mediaDevices = {
  getUserMedia: async () => new MediaStream(),
  enumerateDevices: async () => [],
};

// Stub for permissions
export const PermissionsAndroid = {
  PERMISSIONS: {
    CAMERA: 'android.permission.CAMERA',
    RECORD_AUDIO: 'android.permission.RECORD_AUDIO',
  },
  RESULTS: {
    GRANTED: 'granted',
    DENIED: 'denied',
    NEVER_ASK_AGAIN: 'never_ask_again',
  },
  request: async (permission) => {
    console.warn(`PermissionsAndroid.request('${permission}') called in web environment`);
    return 'granted';
  },
  requestMultiple: async (permissions) => {
    console.warn(`PermissionsAndroid.requestMultiple called in web environment`);
    const result = {};
    permissions.forEach(permission => {
      result[permission] = 'granted';
    });
    return result;
  },
  check: async (permission) => {
    console.warn(`PermissionsAndroid.check('${permission}') called in web environment`);
    return true;
  },
};

// Default exports for different import styles
export default {
  Platform,
  requireNativeComponent,
  RTCView,
  RTCVideoView,
  MediaStream,
  RTCPeerConnection,
  mediaDevices,
  PermissionsAndroid,
};

// Also export requireNativeComponent as default for RTCView.js compatibility
module.exports = requireNativeComponent;
module.exports.Platform = Platform;
module.exports.requireNativeComponent = requireNativeComponent;
module.exports.RTCVideoView = RTCVideoView;
module.exports.RTCView = RTCView;
module.exports.MediaStream = MediaStream;
module.exports.RTCPeerConnection = RTCPeerConnection;
module.exports.mediaDevices = mediaDevices;
module.exports.PermissionsAndroid = PermissionsAndroid;
module.exports.default = requireNativeComponent;