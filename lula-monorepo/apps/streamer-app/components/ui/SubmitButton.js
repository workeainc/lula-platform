import { Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import React from 'react'
import { LinearGradient } from 'expo-linear-gradient'

const SubmitButton = ({ loading, title, className, disabled, ...rest }) => {
    return (
        <TouchableOpacity disabled={loading || disabled} {...rest}>
            <LinearGradient colors={['rgba(97, 86, 226, 0.9)', 'rgba(171, 73, 161, 0.9)']} style={[styles.button, { opacity: disabled ? 0.7 : 1 }]}>
                {loading ? <ActivityIndicator size="small" color={'white'} /> : <Text style={styles.buttonText}>{title}</Text>}
            </LinearGradient>
        </TouchableOpacity>
    )
}

export default SubmitButton

const styles = StyleSheet.create({
    button: {
        backgroundColor: 'white',
        width: '100%',
        paddingVertical: 13,
        paddingHorizontal: 15,
        borderRadius: 45,
        justifyContent: 'center',
        flexDirection: 'row',
        marginBottom: 10,
    },
    buttonText: {
        fontSize: 16,
        color: '#fff',
    },
})
