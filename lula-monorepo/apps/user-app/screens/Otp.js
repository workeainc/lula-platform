import React, { useState } from 'react';
import { StyleSheet, Text, View, ImageBackground, TouchableOpacity, TextInput} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons'

const Otp = () => {

    const navigation = useNavigation();

    return (
        <LinearGradient
            colors={['rgba(97, 86, 226, 0.9)', 'rgba(171, 73, 161, 0.9)', 'rgba(171, 73, 161, 0.9)', 'rgba(171, 73, 161, 0.9)']}
            style={styles.gradient}
        >
            <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
                <MaterialIcons name="keyboard-backspace" size={25} color="white" />
            </TouchableOpacity>
            <View style={styles.content}>
                <Text style={styles.heading}>Enter Your Verification Code  </Text>
                <Text style={styles.smallText}>Enter the 6-digit code sent to your email or phone to verify your identity.</Text>
                <View style={styles.otp}>
                    <TextInput
                        style={styles.input}
                        placeholder="0"
                        placeholderTextColor="#C1C1C1"
                        keyboardType="phone-pad"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="0"
                        placeholderTextColor="#C1C1C1"
                        keyboardType="phone-pad"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="0"
                        placeholderTextColor="#C1C1C1"
                        keyboardType="phone-pad"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="0"
                        placeholderTextColor="#C1C1C1"
                        keyboardType="phone-pad"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="0"
                        placeholderTextColor="#C1C1C1"
                        keyboardType="phone-pad"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="0"
                        placeholderTextColor="#C1C1C1"
                        keyboardType="phone-pad"
                    />
                </View>
                <Text style={styles.smallText}>Resend OTP</Text>
                <View style={styles.buttonContainer}>
                    <TouchableOpacity onPress={() => navigation.navigate('CreateProfile')}>
                        <LinearGradient
                            colors={['rgba(97, 86, 226, 0.9)', 'rgba(171, 73, 161, 0.9)']}
                            style={styles.button2}
                        >
                            <Text style={styles.button2Text} >Verify OTP </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
                <Text style={styles.smallText} className="text-center">Don’t Get It?</Text>
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
        width: '100%',
        justifyContent: 'flex-end',
        padding: 0,
    },
    back: {
        position: 'absolute',
        left: 15,
        top: 15,
    },
    content: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 40,
        width: '100%',
        paddingHorizontal: 20,
        height: '80%',
        backgroundColor: '#fff',
    },
    heading: {
        fontSize: 19,
    },
    otp: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    input: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: 45,
        textAlign: 'center',
        height: 45,
        marginHorizontal: 2,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'gray',
    },
    smallText: {
        fontSize: 12,
        marginBottom: 15,
    },
    button2: {
        backgroundColor: 'white',
        width: '100%',
        paddingVertical: 13,
        paddingHorizontal: 15,
        borderRadius: 45,
        justifyContent: 'center',
        flexDirection: 'row',
        marginBottom: 10,
    },
    button2Text: {
        fontSize: 16,
        color: '#fff',
    },
});
  

export default Otp;