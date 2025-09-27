import React, { useState, useEffect } from 'react'
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Modal, Dimensions, Alert } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'
import Entypo from '@expo/vector-icons/Entypo';
import { useSelector } from 'react-redux'
import CoinService from '../services/CoinService'
import showToast from '../utils/toast'

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
    const { user } = useSelector((state) => state.auth)
    const [coinPlans, setCoinPlans] = useState([])
    const [userBalance, setUserBalance] = useState(0)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        loadCoinPlans()
        loadUserBalance()
    }, [])

    const loadCoinPlans = async () => {
        try {
            const result = await CoinService.getCoinPlans()
            if (!result.error) {
                setCoinPlans(result.data)
            }
        } catch (error) {
            console.error('Failed to load coin plans:', error)
        }
    }

    const loadUserBalance = async () => {
        try {
            if (user?.id) {
                const result = await CoinService.getBalance(user.id)
                if (!result.error) {
                    setUserBalance(result.data.balance)
                }
            }
        } catch (error) {
            console.error('Failed to load user balance:', error)
        }
    }

    const handlePurchase = async (plan) => {
        if (!user?.id) {
            showToast('Please login to purchase coins')
            return
        }

        Alert.alert(
            'Confirm Purchase',
            `Are you sure you want to purchase ${plan.coins} coins for ₹${plan.price}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Purchase',
                    onPress: async () => {
                        setIsLoading(true)
                        try {
                            const result = await CoinService.processPurchase(user.id, plan.id)
                            if (!result.error) {
                                showToast('Coins purchased successfully!')
                                loadUserBalance() // Refresh balance
                            } else {
                                showToast(result.message || 'Purchase failed')
                            }
                        } catch (error) {
                            showToast('Purchase failed. Please try again.')
                        } finally {
                            setIsLoading(false)
                        }
                    }
                }
            ]
        )
    }

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
                                {coinPlans.map((plan, index) => (
                                    <LinearGradient
                                        key={plan.id}
                                        colors={['#fff', '#fff']}
                                        style={styles.card}
                                    >
                                        <Image source={require('../assets/images/coin2.png')} style={styles.cardImage} />
                                        <Text style={styles.coinText}>{plan.coins}</Text>
                                        {plan.bonus > 0 && (
                                            <Text style={styles.bonusText}>+{plan.bonus} Bonus!</Text>
                                        )}
                                        <TouchableOpacity 
                                            onPress={() => handlePurchase(plan)}
                                            disabled={isLoading}
                                        >
                                            <LinearGradient
                                                colors={['#CE54C1', 'rgba(97, 86, 226, 0.9)' ]}
                                                style={[styles.button, isLoading && styles.buttonDisabled]}
                                            >
                                                <View style={styles.buttonInner}>
                                                    <Entypo name="price-tag" size={20} color="white" />
                                                    <Text style={styles.buttonText}>₹{plan.price}</Text>
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