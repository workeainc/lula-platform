import React, { useState } from 'react'
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Modal, Dimensions } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'
import Entypo from '@expo/vector-icons/Entypo';

const rewards = [
    { day: 'Day 1', coins: 1000 },
    { day: 'Day 2', coins: 1000 },
    { day: 'Day 3', coins: 1000 },
    { day: 'Day 4', coins: 1000 },
    { day: 'Day 5', coins: 1000 },
    { day: 'Day 6', coins: 1000 },
    { day: 'Day 7', coins: 1000 },
];

const Plans = () => {
    const navigation = useNavigation()

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <LinearGradient
                colors={['rgba(97, 86, 226, 0.9)', 'rgba(171, 73, 161, 0.9)']}
                style={styles.modalHeader}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <LinearGradient
                            colors={['rgba(97, 86, 226, 0.1)', 'rgba(171, 73, 161, 0)']}
                            style={styles.modalHeaders}
                        >
                            <Text style={styles.modalText}>Recharge</Text>
                        </LinearGradient>
                        <ScrollView vertical={true} style={styles.scrollView} showsVerticalScrollIndicator={false}>
                            <View style={styles.cardsView}>
                                {rewards.map((reward, index) => (
                                    <LinearGradient
                                        key={index}
                                        colors={['#fff', '#fff']}
                                        style={styles.card}
                                    >
                                        <Image source={require('../assets/images/coin2.png')} style={styles.cardImage} />
                                        <Text style={styles.coinText}>{reward.coins}</Text>
                                        <TouchableOpacity onPress={() => navigation.navigate('')}>
                                            <LinearGradient
                                                colors={['#CE54C1', 'rgba(97, 86, 226, 0.9)' ]}
                                                style={styles.button}
                                            >
                                                <View style={styles.buttonInner}>
                                                    <Entypo name="price-tag" size={20} color="white" />
                                                    <Text style={styles.buttonText} className={'text-white rounded-full'}>Recharge Plans</Text>
                                                </View>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    </LinearGradient>
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </LinearGradient>

        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#fff',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        alignItems: 'center',
    },
    modalHeader: {
        alignItems: 'center',
        width: '100%',
        paddingVertical: 8,
    },
    modalText: {
        fontSize: 20,
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    scrollView: {
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
        fontWeight: 'bold',
    },
    cardImage: {
        width: 120,
        height: 90,
        marginVertical: 5,
        objectFit: 'contain',
    },
    coinText: {
        marginTop: 5,
        fontSize: 18,
    },
    button: {
        backgroundColor: '#fff',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 5,
        marginTop: 10,
        flexDirection: 'row',
        width: '100%',
        borderWidth: 0.5,
        borderColor: 'grey',
        justifyContent: 'space-between',
    },
    buttonInner: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    buttonText: {
        marginLeft: 5,
        fontSize: 13,
    },
})

export default Plans