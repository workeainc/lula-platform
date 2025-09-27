import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ImageBackground, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';

const profiles = [
    { id: 1, name: 'Profile 1', image: require('../assets/images/login/bg.png') },
    { id: 2, name: 'Profile 2', image: require('../assets/images/login/bg.png') },
    { id: 3, name: 'Profile 3', image: require('../assets/images/login/bg.png') },
];

const SelectPartner = () => {
    const navigation = useNavigation();
    const [showOverlay, setShowOverlay] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const translateX = new Animated.Value(0);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowOverlay(false);
        }, 2000);
        return () => clearTimeout(timer);
    }, []);

    const onSwipe = (event) => {
        const { translationX } = event.nativeEvent;
        if (translationX < -100) {
            Animated.timing(translateX, {
                toValue: -500,
                duration: 300,
                useNativeDriver: true,
            }).start(() => {
                setCurrentIndex((prevIndex) => (prevIndex + 1) % profiles.length);
                translateX.setValue(0);
            });
        } else if (translationX > 100) {
            Animated.timing(translateX, {
                toValue: 500,
                duration: 300,
                useNativeDriver: true,
            }).start(() => {
                setCurrentIndex((prevIndex) => (prevIndex + 1) % profiles.length);
                translateX.setValue(0);
            });
        }
    };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <ImageBackground 
                source={profiles[currentIndex].image} 
                style={styles.background}
            >
                {showOverlay && (
                    <View style={styles.overlay}>
                        <Text style={styles.overlayText}>Swipe Left to</Text>
                        <Text style={styles.overlayAction}>DISLIKE</Text>
                        <Text style={styles.overlayText}>Swipe Right to</Text>
                        <Text style={styles.overlayAction}>LIKE</Text>
                    </View>
                )}
                <PanGestureHandler onGestureEvent={onSwipe}>
                    <Animated.View style={[styles.card, { transform: [{ translateX }] }]}> 
                        <Text style={styles.cardText}>{profiles[currentIndex].name}</Text>
                    </Animated.View>
                </PanGestureHandler>
            </ImageBackground>
        </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
    background: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlay: {
        position: 'absolute',
        top: '40%',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        padding: 20,
        borderRadius: 10,
    },
    overlayText: {
        color: 'white',
        fontSize: 18,
        textAlign: 'center',
    },
    overlayAction: {
        color: '#ff5c5c',
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    card: {
        width: 300,
        height: 400,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    cardText: {
        fontSize: 24,
        fontWeight: 'bold',
    },
});

export default SelectPartner;