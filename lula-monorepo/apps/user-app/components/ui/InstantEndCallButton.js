// InstantEndCallButton.js
// A component that provides instant call ending functionality

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { shadowPresets } from '../../utils/shadowUtils';

const InstantEndCallButton = ({ call, onCallEnded, style, size = 'medium' }) => {
    const handleInstantEndCall = async () => {
        try {
            console.log('Instant end call button pressed');
            
            // Show confirmation dialog
            Alert.alert(
                'End Call',
                'Are you sure you want to end this call immediately?',
                [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                    },
                    {
                        text: 'End Call',
                        style: 'destructive',
                        onPress: async () => {
                            console.log('User confirmed call ending');
                            
                            // Force terminate call immediately
                            const success = await forceCallTermination(call);
                            
                            if (success) {
                                console.log('Call ended successfully');
                                // Call callback if provided
                                if (onCallEnded) {
                                    onCallEnded();
                                }
                            } else {
                                console.error('Failed to end call');
                                Alert.alert('Error', 'Failed to end call. Please try again.');
                            }
                        },
                    },
                ]
            );
        } catch (error) {
            console.error('Error in instant end call button:', error);
            Alert.alert('Error', 'An error occurred while ending the call.');
        }
    };

    const buttonSize = size === 'large' ? 80 : size === 'small' ? 50 : 65;
    const iconSize = size === 'large' ? 32 : size === 'small' ? 20 : 26;
    const fontSize = size === 'large' ? 16 : size === 'small' ? 12 : 14;

    return (
        <TouchableOpacity
            style={[styles.button, { width: buttonSize, height: buttonSize }, style]}
            onPress={handleInstantEndCall}
            activeOpacity={0.7}
        >
            <LinearGradient
                colors={['#FF3B30', '#FF6B6B']}
                style={[styles.gradient, { borderRadius: buttonSize / 2 }]}
            >
                <Ionicons name="call" size={iconSize} color="white" />
                <Text style={[styles.text, { fontSize }]}>End</Text>
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        ...shadowPresets.large,
    },
    gradient: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        color: 'white',
        fontWeight: 'bold',
        marginTop: 2,
    },
});

export default InstantEndCallButton;
