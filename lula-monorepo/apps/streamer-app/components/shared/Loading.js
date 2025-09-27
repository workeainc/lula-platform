import { LinearGradient } from 'expo-linear-gradient'
import React from 'react'
import { View, Text, ActivityIndicator, StyleSheet, TouchableWithoutFeedback } from 'react-native'

const Loading = ({ isVisible, message = 'Loading...', spinnerColor = 'white', children }) => {
    if (!isVisible) return null

    return (
        <View style={styles.overlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
                <LinearGradient  colors={['rgba(97, 86, 226, 0.9)', 'rgba(171, 73, 161, 0.9)']} style={{borderRadius:10}}>
                    <View style={styles.overlayContent}>
                        <ActivityIndicator size="large" color={spinnerColor} />
                        <Text style={styles.message}>{message}</Text>
                    </View>
                </LinearGradient>
            </TouchableWithoutFeedback>
        </View>
    )
}

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999, // Ensure it's on top of everything
    },
    overlayContent: {
        // backgroundColor: 'rgba(0, 0, 0, 0.8)', // Dark background for the spinner and message
        padding: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    message: {
        marginTop: 10,
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
})

export default Loading
