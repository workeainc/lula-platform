import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ImageBackground, TouchableOpacity, Animated, FlatList, ScrollView, Image, Dimensions, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Entypo from '@expo/vector-icons/Entypo';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const { width: screenWidth } = Dimensions.get('window');
const { height: screenHeight } = Dimensions.get('window');

const rewards = [
    { day: 'Day 1', coins: 1000 },
    { day: 'Day 2', coins: 1000 },
    { day: 'Day 3', coins: 1000 },
    { day: 'Day 4', coins: 1000 },
    { day: 'Day 5', coins: 1000 },
    { day: 'Day 6', coins: 1000 },
    { day: 'Day 7', coins: 1000 },
];

const Main = () => {
    const [modalVisible, setModalVisible] = useState(false);
    const navigation = useNavigation();
    
    // Create refs for the ScrollView components
    const scrollViewRef1 = useRef(null);
    const scrollViewRef2 = useRef(null);
    const scrollViewRef3 = useRef(null);
    
    const scrollY1 = useRef(new Animated.Value(0)).current;
    const scrollY2 = useRef(new Animated.Value(0)).current;
    const scrollY3 = useRef(new Animated.Value(0)).current;

    const startAutoScroll = () => {
        const totalScrollHeight = 230; // Adjust based on your layout
    
        const createLoopingAnimation = (animatedValue, direction) => {
            return Animated.loop(
                Animated.sequence([
                    Animated.timing(animatedValue, {
                        toValue: direction * totalScrollHeight, // Move in the desired direction
                        duration: 20000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(animatedValue, {
                        toValue: 0, // Reset position to start without visual cut
                        duration: 0, // Instantly reset to create an infinite loop
                        useNativeDriver: true,
                    }),
                ])
            );
        };
    
        createLoopingAnimation(scrollY1, -1).start(); // Scroll upwards
        createLoopingAnimation(scrollY2, 1).start();  // Scroll downwards
        createLoopingAnimation(scrollY3, -1).start(); // Scroll upwards
    };
    
    useEffect(() => {
        const timer = setTimeout(() => {
            setModalVisible(true);
        }, 3000);

        startAutoScroll();

        return () => clearTimeout(timer);
    }, []);

    return (
        <LinearGradient
            colors={['rgba(171, 73, 161, 0.9)', 'rgba(97, 86, 226, 0.9)', ]}
            style={styles.gradient}
        >
            <View style={styles.header}>
                <Text style={styles.headerTitle}>LULA</Text>
                <View style={styles.headerIcons}>
                    <TouchableOpacity style={styles.headerIconsTab}>
                        <MaterialIcons name="analytics" size={29} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <Image source={require('../assets/images/men.png')} style={styles.headerIconsImage} />
                    </TouchableOpacity>
                </View>
            </View>
            <View style={styles.content}>
                <View style={styles.scrollDiv}>
                    <Animated.ScrollView
                        ref={scrollViewRef1}
                        style={[styles.scrollViewOne, { transform: [{ translateY: scrollY1 }] }]}
                        showsVerticalScrollIndicator={false}
                        scrollEnabled={false}
                    >
                        <Image source={require('../assets/images/1.png')} style={styles.image} />
                        <Image source={require('../assets/images/2.png')} style={styles.image} />
                        <Image source={require('../assets/images/3.png')} style={styles.image} />
                        <Image source={require('../assets/images/4.png')} style={styles.image} />
                        <Image source={require('../assets/images/1.png')} style={styles.image} />
                        <Image source={require('../assets/images/2.png')} style={styles.image} />
                    </Animated.ScrollView>
                    
                    <Animated.ScrollView
                        ref={scrollViewRef2}
                        style={[styles.scrollViewOne, styles.customUp, { transform: [{ translateY: scrollY2 }] }]}
                        showsVerticalScrollIndicator={false}
                        scrollEnabled={false}
                    >
                        <Image source={require('../assets/images/3.png')} style={styles.image} />
                        <Image source={require('../assets/images/4.png')} style={styles.image} />
                        <Image source={require('../assets/images/1.png')} style={styles.image} />
                        <Image source={require('../assets/images/2.png')} style={styles.image} />
                        <Image source={require('../assets/images/3.png')} style={styles.image} />
                        <Image source={require('../assets/images/4.png')} style={styles.image} />
                    </Animated.ScrollView>
                    
                    <Animated.ScrollView
                        ref={scrollViewRef3}
                        style={[styles.scrollViewOne, styles.customUp2, { transform: [{ translateY: scrollY3 }] }]}
                        showsVerticalScrollIndicator={false}
                        scrollEnabled={false}
                    >
                        <Image source={require('../assets/images/1.png')} style={styles.image} />
                        <Image source={require('../assets/images/2.png')} style={styles.image} />
                        <Image source={require('../assets/images/3.png')} style={styles.image} />
                        <Image source={require('../assets/images/4.png')} style={styles.image} />
                        <Image source={require('../assets/images/1.png')} style={styles.image} />
                    </Animated.ScrollView>
                </View>

                <Text style={styles.countText}>1,234</Text>
                <Text style={styles.mediumText}>Girls in real-time interaction</Text>
                <Text style={styles.smallText}>Find your dream girl right now!</Text>
                <TouchableOpacity style={styles.button2O} onPress={() => navigation.navigate('LiveStreaming')}>
                    <LinearGradient
                        colors={['rgba(171, 73, 161, 0.9)', 'rgba(97, 86, 226, 0.9)', ]}
                        style={styles.button2}
                    >
                        <Text style={styles.button2Text}>Start Matching</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* <Modal
                visible={modalVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <LinearGradient
                            colors={['rgba(97, 86, 226, 0.9)', 'rgba(171, 73, 161, 0.9)']}
                            style={styles.modalHeader}
                        >
                            <Text style={styles.modalText}>Daily Reward</Text>
                        </LinearGradient>
                        <TouchableOpacity 
                            onPress={() => setModalVisible(false)} 
                            style={styles.closeButton}
                        >
                            <Entypo name="cross" size={20} color="white" />
                        </TouchableOpacity>
                        <ScrollView vertical={true} style={styles.scrollView} showsVerticalScrollIndicator={false}>
                            <View style={styles.cardsView}>
                                {rewards.map((reward, index) => (
                                    <LinearGradient
                                        key={index}
                                        colors={['#C850C0', '#4158D0']}
                                        style={styles.card}
                                    >
                                        <Text style={styles.dayText}>{reward.day}</Text>
                                        <Image source={require('../assets/images/coin.png')} style={styles.cardImage} />
                                        <Text style={styles.coinText}>{reward.coins}</Text>
                                    </LinearGradient>
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal> */}
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
    header: {
        width: '100%',
        paddingHorizontal: 10,
        paddingVertical: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    headerIcons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    headerIconsImage: {
        width: 32,
        height: 32,
        marginLeft: 10,
        borderRadius: 250,
        objectFit: 'cover',
    },
    content: {
        width: '100%',
        marginBottom: 30,
        alignItems: 'center',
        backgroundColor: '#fff',
        borderTopLeftRadius: 15,
        height: '100%',
        borderTopRightRadius: 15,
    },
    scrollDiv: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        marginBottom: 20,
        height: screenHeight * 0.5,
        overflow: 'hidden',
    },
    scrollViewOne: {
        width: screenWidth * 0.3,
        marginHorizontal: 5,
    },
    customUp: {
        marginTop: -100,
    },
    customUp2: {
        marginTop: -50,
    },
    image: {
        width: '95%',
        marginBottom: 10,
        height: 220,
        borderRadius: 50,
        resizeMode: 'cover',
    },
    button2O: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    button2: {
        backgroundColor: '#6156E2',
        paddingVertical: 13,
        paddingHorizontal: 15,
        borderRadius: 45,
        marginBottom: 10,
        width: '85%',
    },
    button2Text: {
        fontSize: 16,
        color: '#fff',
        textAlign: 'center',
    },
    countText: {
        fontSize: 35,
    },
    mediumText: {
        fontSize: 20,
        marginBottom: 10,
    },
    smallText: {
        fontSize: 11,
        marginBottom: 5,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 5,
        width: '80%',
        alignItems: 'center',
    },
    modalHeader: {
        alignItems: 'center',
        width: '100%',
        paddingVertical: 8,
        marginBottom: 10,
    },
    modalText: {
        fontSize: 15,
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 1,
    },
    scrollView: {
        maxHeight: screenHeight * 0.8,
        width: '100%',
    },
    cardsView: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        padding: 10,
        width: '100%',
    },
    card: {
        width: '48%',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
        paddingVertical: 15,
    },
    dayText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: 'bold',
    },
    cardImage: {
        width: 60,
        height: 60,
        marginVertical: 5,
        resizeMode: 'contain',
    },
    coinText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default Main;