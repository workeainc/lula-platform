import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, Image, Dimensions, Modal } from 'react-native'
import Animated, { useSharedValue, useAnimatedGestureHandler, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated'
import { PanGestureHandler, GestureHandlerRootView } from 'react-native-gesture-handler'
import { LinearGradient } from 'expo-linear-gradient'
import { useNavigation } from '@react-navigation/native'

const { width, height } = Dimensions.get('window')
const SWIPE_THRESHOLD = width * 0.25

const cards = [
    {
        id: '1',
        image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=688&auto=format&fit=crop',
    },
    {
        id: '2',
        image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=687&auto=format&fit=crop',
    },
    {
        id: '3',
        image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=1470&auto=format&fit=crop',
    },
    {
        id: '1',
        image: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?q=80&w=687&auto=format&fit=crop',
    },
    {
        id: '2',
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=764&auto=format&fit=crop',
    },
]

const TinderCard = ({ user, onSwipeOff, index }) => {
    const translateX = useSharedValue(0)
    const rotate = useSharedValue(0)

    const gestureHandler = useAnimatedGestureHandler({
        onActive: (event) => {
            translateX.value = event.translationX
            rotate.value = (event.translationX / width) * 25
        },
        onEnd: () => {
            if (Math.abs(translateX.value) > SWIPE_THRESHOLD) {
                translateX.value = withSpring(translateX.value > 0 ? width : -width, {}, () => runOnJS(onSwipeOff)())
            } else {
                translateX.value = withSpring(0)
                rotate.value = withSpring(0)
            }
        },
    })

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }, { rotate: `${rotate.value}deg` }],
        zIndex: -index,
    }))

    return (
        <PanGestureHandler onGestureEvent={gestureHandler}>
            <Animated.View style={[styles.card, animatedStyle]}>
                                        <Image source={user?.image && typeof user.image === 'string' && user.image.trim() !== '' ? { uri: user.image } : require('../assets/images/avatar.png')} style={styles.image} />
            </Animated.View>
        </PanGestureHandler>
    )
}

const TinderSwipe = () => {
    const navigation = useNavigation()
    const [users, setUsers] = useState(cards)

    const removeTopCard = () => {
        setUsers((prevUsers) => prevUsers.slice(1))
    }

    const [modalVisible, setModalVisible] = useState(false)

    useEffect(() => {
        const model = setTimeout(() => {
            setModalVisible(true);
        }, 6000);
        return () => clearTimeout(model);
    }, [])

    useEffect(() => {
        const pageChange = setTimeout(() => {
            navigation.navigate('LiveStreaming');
        }, 8000);
        return () => clearTimeout(pageChange);
    }, [])

    return (
        <GestureHandlerRootView style={styles.container}>
            {
                users
                    .map((user, index) => <TinderCard key={user.id} user={user} onSwipeOff={removeTopCard} index={index} />)
                    .reverse()
            }
            <View style={styles.content}>
                <View style={styles.connect}>
                    <Image style={styles.sideImage} source={require('../assets/images/women.png')} />
                    <Image style={styles.connectIcon} source={require('../assets/images/connect.png')} />
                    <Image style={styles.sideImage} source={require('../assets/images/men.png')} />
                </View>
            </View>
            <Modal visible={modalVisible} animationType="fade" transparent={true} onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <LinearGradient colors={['#AB80DE', '#fff']} style={styles.modalHeader}>
                            <Image style={styles.modelImage} source={require('../assets/images/women.png')} />
                            <Text style={styles.modalText}>Danielita</Text>
                            <Text style={styles.smallText}>You like her. Waiting for her reply</Text>
                        </LinearGradient>
                    </View>
                </View>
            </Modal>
        </GestureHandlerRootView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000',
    },
    content: {
        flex: 1,
        padding: 20,
        width: '100%',
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
    },
    connect: {
        position: 'absolute',
        left: 20,
        right: 20,
        bottom: 20,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sideImage: {
        borderRadius: 10,
        width: '30%',
        height: 170,
        resizeMode: 'cover',
    },
    connectIcon: {
        width: 50,
        height: 50,
        resizeMode: 'contain',
    },
    card: {
        position: 'absolute',
        width: width * 1,
        height: height * 1,
        backgroundColor: 'black',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        flex: 1,
    },

    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    modalContent: {
        borderRadius: 20,
        width: '60%',
        alignItems: 'center',
    },
    modalHeader: {
        alignItems: 'center',
        width: '100%',
        borderRadius: 20,
        paddingVertical: 20,
    },
    modalText: {
        fontSize: 15,
        color: '#000',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    smallText: {
        fontSize: 12,
        color: '#000',
        textAlign: 'center',
    },
    modelImage: {
        width: 90,
        height: 90,
        objectFit: 'cover',
        borderRadius: 100,
    },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
    },
})

export default TinderSwipe
