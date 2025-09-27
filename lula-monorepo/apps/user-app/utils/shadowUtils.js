import { Platform } from 'react-native';

/**
 * Creates web-compatible shadow styles
 * On web, uses boxShadow instead of shadowColor/shadowOffset/shadowOpacity/shadowRadius
 * On native, uses the original shadow properties
 */
export const createShadowStyle = (shadowConfig) => {
  if (Platform.OS === 'web') {
    const { shadowColor = '#000', shadowOffset = { width: 0, height: 2 }, shadowOpacity = 0.25, shadowRadius = 3.84 } = shadowConfig;
    
    // Convert shadow properties to CSS boxShadow
    const offsetX = shadowOffset.width || 0;
    const offsetY = shadowOffset.height || 0;
    const blurRadius = shadowRadius || 0;
    const spreadRadius = 0; // React Native doesn't have spread radius
    
    // Convert shadowColor with opacity
    const color = shadowColor || '#000';
    const opacity = shadowOpacity || 0.25;
    
    // Convert hex color to rgba if needed
    let rgbaColor;
    if (color.startsWith('#')) {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      rgbaColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
    } else {
      rgbaColor = color;
    }
    
    return {
      boxShadow: `${offsetX}px ${offsetY}px ${blurRadius}px ${spreadRadius}px ${rgbaColor}`,
    };
  }
  
  // For native platforms, return the original shadow properties
  return shadowConfig;
};

/**
 * Common shadow presets for consistent styling
 */
export const shadowPresets = {
  small: createShadowStyle({
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  }),
  
  medium: createShadowStyle({
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  }),
  
  large: createShadowStyle({
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  }),
  
  card: createShadowStyle({
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  }),
  
  button: createShadowStyle({
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  }),
};
