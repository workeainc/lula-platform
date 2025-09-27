import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ImageBackground, TouchableOpacity, Animated, FlatList, ScrollView, Image, Dimensions, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Entypo from '@expo/vector-icons/Entypo';

const { width: screenWidth } = Dimensions.get('window');
const { height: screenHeight } = Dimensions.get('window');


const ExploreMatch = () => {
    const navigation = useNavigation();

    return (
        <LinearGradient
            colors={['rgba(97, 86, 226, 0.9)', 'rgba(171, 73, 161, 0.9)' ]}
            style={styles.gradient}
        >
            <View style={styles.content}>
                <Text style={styles.mediumText}>Chat Away & Explore</Text>
                <View style={styles.middleSection}>
                    <View style={styles.connect}>
                        <View style={styles.sideImage}>
                            <Image style={styles.image} source={require('../assets/images/women.png')} />
                            <LinearGradient
                                colors={['rgba(225, 225, 225, 0)', 'rgba(0, 0, 0, 0.2)', 'rgba(171, 73, 161, 0.9)', 'rgba(171, 73, 161, 0.9)', 'rgba(171, 73, 161, 0.9)' ]} 
                                style={styles.bottomText}>
                                    <Text style={styles.smallText}>Soni Liya</Text>
                                    <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('StartCalling')}>
                                        <Text style={styles.buttonText}>Call Me</Text>
                                    </TouchableOpacity>
                            </LinearGradient>
                        </View>
                        <View style={styles.sideImage}>
                            <Image style={styles.image} source={require('../assets/images/men.png')} />
                            <LinearGradient
                                colors={['rgba(225, 225, 225, 0)', 'rgba(0, 0, 0, 0.2)', 'rgba(171, 73, 161, 0.9)', 'rgba(171, 73, 161, 0.9)', 'rgba(171, 73, 161, 0.9)' ]} 
                                style={styles.bottomText}>
                                    <Text style={styles.smallText}>John</Text>
                                    <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('StartCalling')}>
                                        <Text style={styles.buttonText}>Call Me</Text>
                                    </TouchableOpacity>
                            </LinearGradient>
                        </View>
                        <View style={styles.sideImage}>
                            <Image style={styles.image} source={require('../assets/images/women.png')} />
                            <LinearGradient
                                colors={['rgba(225, 225, 225, 0)', 'rgba(0, 0, 0, 0.2)', 'rgba(171, 73, 161, 0.9)', 'rgba(171, 73, 161, 0.9)', 'rgba(171, 73, 161, 0.9)' ]} 
                                style={styles.bottomText}>
                                    <Text style={styles.smallText}>John</Text>
                                    <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('StartCalling')}>
                                        <Text style={styles.buttonText}>Call Me</Text>
                                    </TouchableOpacity>
                            </LinearGradient>
                        </View>
                    </View>
                </View>

                <TouchableOpacity style={styles.button2} onPress={() => navigation.navigate('LiveStreaming')}>
                    <Text style={styles.button2Text}>Start Live Streaming</Text>
                </TouchableOpacity>
            </View>
        </LinearGradient>
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
        alignItems: 'center',
        padding: 0,
    },
    content: {
        flex: 1,
        padding: 20,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    middleSection: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 70,
        marginBottom: 70,
    },
    connect: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sideImage: {
        width: '32%',
        height: 180,
        borderRadius: 10,
    },
    bottomText: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        paddingVertical: 5,
        paddingHorizontal: 8,
        borderBottomRightRadius: 10,
        borderBottomLeftRadius: 10,
    },
    smallText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    image: {
        borderRadius: 10,
        width: '100%',
        height: 180,
        resizeMode: 'cover',
    },
    connectIcon: {
        width: 50,
        height: 50,
        resizeMode: 'contain',
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
        borderWidth: 1,
        borderColor: '#EEE',
    },
    button2Text: {
        fontSize: 16,
        color: '#fff',
    },
    button: {
        backgroundColor: '#6156E2',
        width: '100%',
        paddingVertical: 4,
        paddingHorizontal: 5,
        borderRadius: 4,
        justifyContent: 'center',
        flexDirection: 'row',
        marginBottom: 2,
    },
    buttonText: {
        fontSize: 12,
        color: '#fff',
    },
    mediumText: {
        fontSize: 24,
        fontWeight: '600',
        color: '#fff',
    },
});

export default ExploreMatch;