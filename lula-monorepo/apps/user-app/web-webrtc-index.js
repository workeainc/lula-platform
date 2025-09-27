// web-webrtc-index.js
// Complete web polyfill for @stream-io/react-native-webrtc package

import RTCView from './web-rtcview.js';
import { PermissionsAndroid } from './web-compat.js';

// Export all the WebRTC components that might be imported
export { RTCView };
export { PermissionsAndroid };
export default RTCView;

// Also provide any other WebRTC related exports that might be expected
export const RTCPeerConnection = window.RTCPeerConnection || (() => null);
export const RTCSessionDescription = window.RTCSessionDescription || (() => null);
export const RTCIceCandidate = window.RTCIceCandidate || (() => null);
export const MediaStream = window.MediaStream || (() => null);
export const MediaStreamTrack = window.MediaStreamTrack || (() => null);

// Provide getUserMedia polyfill
export const getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || (() => Promise.resolve(null));

// CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    RTCView,
    PermissionsAndroid,
    RTCPeerConnection,
    RTCSessionDescription,
    RTCIceCandidate,
    MediaStream,
    MediaStreamTrack,
    getUserMedia,
    default: RTCView
  };
}