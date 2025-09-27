const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')
const path = require('path')

const config = getDefaultConfig(__dirname)

// Add web-specific resolver configuration
config.resolver.platforms = ['ios', 'android', 'native', 'web']

// Add web-specific module resolution
config.resolver.resolverMainFields = ['react-native', 'browser', 'main']

// Create comprehensive alias mapping for web compatibility
config.resolver.alias = {
  ...config.resolver.alias,
  // React Native Web specific paths
  'react-native-web/dist/exports/PermissionsAndroid': path.resolve(__dirname, 'web-permissions.js'),
  'react-native-web/dist/cjs/exports/PermissionsAndroid': path.resolve(__dirname, 'web-permissions.js'),
  'react-native-web/dist/commonjs/exports/PermissionsAndroid': path.resolve(__dirname, 'web-permissions.js'),
  
  // Stream.io WebRTC module replacements - Complete package override
  '@stream-io/react-native-webrtc/lib/module/index.js': path.resolve(__dirname, 'web-webrtc-index.js'),
  '@stream-io/react-native-webrtc/lib/commonjs/index.js': path.resolve(__dirname, 'web-webrtc-index.js'),
  '@stream-io/react-native-webrtc/lib/module/RTCView.js': path.resolve(__dirname, 'web-rtcview-module.js'),
  '@stream-io/react-native-webrtc/lib/commonjs/RTCView.js': path.resolve(__dirname, 'web-rtcview-module.js'),
  '@stream-io/react-native-webrtc/lib/module/RTCView': path.resolve(__dirname, 'web-rtcview-module.js'),
  '@stream-io/react-native-webrtc/lib/commonjs/RTCView': path.resolve(__dirname, 'web-rtcview-module.js'),
  '@stream-io/react-native-webrtc/lib/module/Permissions': path.resolve(__dirname, 'web-compat.js'),
  '@stream-io/react-native-webrtc/lib/commonjs/Permissions': path.resolve(__dirname, 'web-compat.js'),
  '@stream-io/react-native-webrtc/lib/module/index': path.resolve(__dirname, 'web-compat.js'),
  '@stream-io/react-native-webrtc/lib/commonjs/index': path.resolve(__dirname, 'web-compat.js'),
  '@stream-io/react-native-webrtc/lib/module': path.resolve(__dirname, 'web-compat.js'),
  '@stream-io/react-native-webrtc/lib/commonjs': path.resolve(__dirname, 'web-compat.js'),
  '@stream-io/react-native-webrtc': path.resolve(__dirname, 'web-webrtc-index.js'),
  
  // React Native core module replacements
  'react-native/Libraries/Permissions/PermissionsAndroid': path.resolve(__dirname, 'web-compat.js'),
  'react-native/Libraries/Components/WebView/WebView': path.resolve(__dirname, 'web-compat.js'),
}

// Enhanced resolver options for web platform
config.resolver.sourceExts = [...config.resolver.sourceExts, 'web.js', 'web.ts', 'web.tsx']
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(__dirname, '../node_modules'),
]

module.exports = withNativeWind(config, { input: './global.css' })
