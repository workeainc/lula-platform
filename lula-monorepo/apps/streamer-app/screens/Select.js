import React from 'react';
import { StyleSheet, Text, View, ImageBackground, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import AntDesign from '@expo/vector-icons/AntDesign';

const Select = () => {

    const navigation = useNavigation();

    return (
        <ImageBackground
            source={require('../assets/images/login/bg.png')}
            style={styles.container}
        >
            <LinearGradient
                colors={['rgba(97, 86, 226, 0.9)', 'rgba(171, 73, 161, 0.9)']} 
                style={styles.gradient}
            >
                <View style={styles.content}>
                    <View style={styles.orContainer}>
                        <Text style={styles.largeText}>Sign in with</Text>
                    </View>
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.button2} onPress={() => navigation.navigate('OnBoarding1')}>
                            <Image style={styles.google} source={require('../assets/images/google.png')} /><Text style={styles.button2Text}>Google Login</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.button2} onPress={() => navigation.navigate('Login')}>
                            <Image style={styles.google} source={require('../assets/images/phone.png')} /><Text style={styles.button2Text} >Phone Number</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.orContainer}>
                        <View style={styles.line} />
                        <Text style={styles.Or}>OR</Text>
                        <View style={styles.line} />
                    </View>
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Main')}>
                            <Text style={styles.buttonText} >Quick Login</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.smallText}>By logging in, you confirm you, Google login  / guest login</Text>
                </View>
            </LinearGradient>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    gradient: {
        flex: 1,
        width: '100%',
        justifyContent: 'flex-end',
        alignItems: 'center',
        padding: 0,
    },
    content: {
        alignItems: 'center',
        width: '100%',
        marginBottom: 30,
    },
    orContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        justifyContent: 'center',
        marginVertical: 20,
    },
    line: {
        height: 1,
        width: 50,
        backgroundColor: 'white',
        marginHorizontal: 10,
    },
    Or: {
        color: 'white',
        fontSize: 15,
        textAlign: 'center',
    },
    largeText: {
        fontSize: 25,
        color: 'white',
        marginBottom: 30,
    },
    smallText: {
        fontSize: 12,
        color: 'white',
        marginTop: 50,
    },
    buttonContainer: {
        width: '80%',
        alignItems: 'center',
    },
    button: {
        width: '100%',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: '#fff',
        borderRadius: 40,
        justifyContent: 'center',
        flexDirection: 'row',
        marginBottom: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
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
    },
    google: {
        width: 22,
        height: 22,
        position: 'absolute',
        left: 16,
        top: 14,
        objectFit: 'contain',
    },
});

export default Select;