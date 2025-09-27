// Web-specific RTCView component for @stream-io/react-native-webrtc
import React from 'react';
import { View, Text } from 'react-native';

// RTCView component for web environment
const RTCView = React.forwardRef((props, ref) => {
  const { streamURL, style, ...otherProps } = props;
  
  return (
    <View 
      {...otherProps} 
      ref={ref} 
      style={[
        style, 
        { 
          backgroundColor: '#000', 
          justifyContent: 'center', 
          alignItems: 'center',
          minHeight: 200,
          borderRadius: 8,
        }
      ]}
    >
      <Text style={{ color: 'white', fontSize: 16, textAlign: 'center' }}>
        📹 Video Stream{'\n'}(Web Environment)
      </Text>
      {streamURL && (
        <Text style={{ color: '#ccc', fontSize: 12, marginTop: 8 }}>
          Stream: {streamURL.substring(0, 20)}...
        </Text>
      )}
    </View>
  );
});

RTCView.displayName = 'RTCView';

export default RTCView;