import { registerRootComponent } from 'expo';
import App from './App';

// Web-compatible version - Firebase disabled for Docker deployment
console.log('🌐 [index.web.js] Starting app in web mode - Firebase disabled');

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
