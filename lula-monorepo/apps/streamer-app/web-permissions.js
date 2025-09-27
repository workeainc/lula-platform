// Web permissions stub for React Native Web
export const PermissionsAndroid = {
  PERMISSIONS: {
    CAMERA: 'android.permission.CAMERA',
    RECORD_AUDIO: 'android.permission.RECORD_AUDIO',
    READ_EXTERNAL_STORAGE: 'android.permission.READ_EXTERNAL_STORAGE',
    WRITE_EXTERNAL_STORAGE: 'android.permission.WRITE_EXTERNAL_STORAGE',
  },
  RESULTS: {
    GRANTED: 'granted',
    DENIED: 'denied',
    NEVER_ASK_AGAIN: 'never_ask_again',
  },
  request: async (permission) => {
    console.warn(`PermissionsAndroid.request('${permission}') called in web environment - auto-granting`);
    return 'granted';
  },
  requestMultiple: async (permissions) => {
    console.warn(`PermissionsAndroid.requestMultiple called in web environment - auto-granting all`);
    const result = {};
    permissions.forEach(permission => {
      result[permission] = 'granted';
    });
    return result;
  },
  check: async (permission) => {
    console.warn(`PermissionsAndroid.check('${permission}') called in web environment - returning true`);
    return true;
  },
};

// Default export for compatibility
export default PermissionsAndroid;