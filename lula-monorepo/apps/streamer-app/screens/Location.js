import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ImageBackground, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

const Location = () => {
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
                    <Image source={require('../assets/images/location.png')} style={styles.image} />
                </View>

                <TouchableOpacity style={styles.button2} onPress={() => navigation.navigate('Explore')}>
                    <Text style={styles.button2Text}>Find Your Partner</Text>
                </TouchableOpacity>
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
        justifyContent: 'center',
        alignItems: 'center',
        padding: 0,
    },
    content: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '97%',
        height: 300,
        marginBottom: 40,
        objectFit: 'contain',
    },
    button2: {
        backgroundColor: '#6156E2',
        width: '85%',
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

export default Location;
