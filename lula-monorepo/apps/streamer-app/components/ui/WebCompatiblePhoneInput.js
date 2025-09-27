import React, { useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import PhoneInput from 'react-native-phone-number-input';

const WebCompatiblePhoneInput = (props) => {
  const phoneInputRef = useRef();
  const [isWeb] = useState(Platform.OS === 'web');

  // For web platform, create a simplified phone input
  if (isWeb) {
    return (
      <View style={styles.webContainer}>
        <View style={styles.webPhoneInput}>
          <View style={styles.countryCodeContainer}>
            <Text style={styles.countryCodeText}>+91</Text>
          </View>
          <TextInput
            style={styles.webTextInput}
            placeholder="Phone Number"
            keyboardType="phone-pad"
            onChangeText={props.onChangeText}
            autoFocus={props.autoFocus}
            value={props.value}
          />
        </View>
      </View>
    );
  }

  // For native platforms, use the original PhoneInput
  return (
    <PhoneInput
      ref={props.ref || phoneInputRef}
      {...props}
      // Override problematic styles for web compatibility
      textInputStyle={[
        props.textInputStyle,
        {
          // Remove problematic web styles
          outlineWidth: undefined,
          outlineColor: undefined,
          outlineOffset: undefined,
        }
      ]}
      containerStyle={[
        props.containerStyle,
        {
          // Ensure web compatibility
          textAlign: undefined,
        }
      ]}
    />
  );
};

const styles = StyleSheet.create({
  webContainer: {
    width: '100%',
    marginBottom: 16,
  },
  webPhoneInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    height: 48,
  },
  countryCodeContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: '#D1D5DB',
    backgroundColor: '#F3F4F6',
  },
  countryCodeText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  webTextInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: 'transparent',
    // Remove problematic web styles
    outlineWidth: 0,
    outlineColor: 'transparent',
    outlineOffset: 0,
  },
});

export default WebCompatiblePhoneInput;
