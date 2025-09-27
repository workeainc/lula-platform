import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ImageBackground, TouchableOpacity, Animated, FlatList, ScrollView, Image, Dimensions, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

const { width: screenWidth } = Dimensions.get('window');
const { height: screenHeight } = Dimensions.get('window');

const Explore = () => {
    const navigation = useNavigation();
    const [buttonVisible, setButtonVisible] = useState(false);  // State to control button visibility

    useEffect(() => {
        const timer = setTimeout(() => {
            setButtonVisible(true);  // Show button after 5 seconds
        }, 5000);  // 5000 milliseconds = 5 seconds

        return () => clearTimeout(timer);  // Cleanup timeout if component unmounts
    }, []);

    return (
        <LinearGradient
            colors={['rgba(97, 86, 226, 0.9)', 'rgba(171, 73, 161, 0.9)']}
            style={styles.gradient}
        >
            <View style={styles.content}>
                <Text style={styles.mediumText} className={'pt-12 mb-10'}>Chat Away & Explore</Text>
                <View style={styles.scrollDiv}>
                    <ScrollView vertical={true} contentContainerStyle={styles.scrollViewOne} showsVerticalScrollIndicator={false}>
                        <Image source={require('../assets/images/1.png')} style={styles.image} />
                        <Image source={require('../assets/images/2.png')} style={styles.image} />
                        <Image source={require('../assets/images/3.png')} style={styles.image} />
                    </ScrollView>
                    <ScrollView vertical={true} contentContainerStyle={styles.scrollViewOne} showsVerticalScrollIndicator={false}>
                        <Image source={require('../assets/images/4.png')} style={styles.image} />
                        <Image source={require('../assets/images/1.png')} style={styles.image} />
                        <Image source={require('../assets/images/2.png')} style={styles.image} />
                    </ScrollView>
                    <ScrollView vertical={true} contentContainerStyle={styles.scrollViewOne} showsVerticalScrollIndicator={false}>
                        <Image source={require('../assets/images/3.png')} style={styles.image} />
                        <Image source={require('../assets/images/4.png')} style={styles.image} />
                        <Image source={require('../assets/images/1.png')} style={styles.image} />
                    </ScrollView>
                </View>

                {/* Render the Explore button only if buttonVisible is true */}
                {buttonVisible && (
                    <TouchableOpacity style={styles.button2} onPress={() => navigation.navigate('ExploreMatch')}>
                        <Text style={styles.button2Text}>Explore</Text>
                    </TouchableOpacity>
                )}
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
        width: '100%',
        marginBottom: 30,
        alignItems: 'center',
    },
    scrollDiv: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        marginBottom: 20,
        height: screenHeight * 0.6,
    },
    scrollViewOne: {
        width: screenWidth * 0.3,
        marginHorizontal: 5,
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        marginBottom: 10,  
        height: 160,
        borderRadius: 10,
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
    mediumText: {
        fontSize: 24,
        fontWeight: '600',
        color: '#fff',
    },
});

export default Explore;
