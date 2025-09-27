import React from 'react'
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'

const TransactionHistory = () => {
    const navigation = useNavigation()

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerText}>Transaction History</Text>
            </View>
            <View style={styles.cardsView}>
                <LinearGradient
                    colors={['#C850C0', '#4158D0']}
                    style={styles.card}
                >
                    <View style={styles.profileContainer}>
                        <Image source={require('../assets/images/men.png')} style={styles.profile} />
                        <View>
                            <Text style={styles.transactionText}>GIFT SEND (dumble)</Text>
                            <Text style={styles.userName}>@Kishan raj</Text>
                            <Text style={styles.date}>01-02-2021</Text>
                        </View>
                    </View>
                    <View style={styles.coinContainer}>
                        <Image source={require('../assets/images/coin.png')} style={styles.coinImage} />
                        <Text style={styles.coinAmount}>100</Text>
                    </View>
                </LinearGradient>
                <LinearGradient
                    colors={['#C850C0', '#4158D0']} 
                    style={styles.card}
                >
                    <View style={styles.profileContainer}>
                        <Image source={require('../assets/images/men.png')} style={styles.profile} />
                        <View>
                            <Text style={styles.transactionText}>GIFT SEND (dumble)</Text>
                            <Text style={styles.userName}>@Kishan raj</Text>
                            <Text style={styles.date}>01-02-2021</Text>
                        </View>
                    </View>
                    <View style={styles.coinContainer}>
                        <Image source={require('../assets/images/coin.png')} style={styles.coinImage} />
                        <Text style={styles.coinAmount}>100</Text>
                    </View>
                </LinearGradient>
                <LinearGradient
                    colors={['#C850C0', '#4158D0']} 
                    style={styles.card}
                >
                    <View style={styles.profileContainer}>
                        <Image source={require('../assets/images/men.png')} style={styles.profile} />
                        <View>
                            <Text style={styles.transactionText}>GIFT SEND (dumble)</Text>
                            <Text style={styles.userName}>@Kishan raj</Text>
                            <Text style={styles.date}>01-02-2021</Text>
                        </View>
                    </View>
                    <View style={styles.coinContainer}>
                        <Image source={require('../assets/images/coin.png')} style={styles.coinImage} />
                        <Text style={styles.coinAmount}>100</Text>
                    </View>
                </LinearGradient>
            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#fff',
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    headerText: {
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        marginTop: 10,
        marginBottom: 10,
    },
    cardsView: {
        flexDirection: 'column',
        paddingHorizontal: 20,
        width: '100%',
    },
    card: {
        width: '100%',
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 15,
        paddingVertical: 15,
        paddingHorizontal: 20,
    },
    profileContainer: {
        flexDirection: 'row',
    },
    profile: {
        width: 40,
        height: 40,
        objectFit: 'cover',
        borderRadius: 5,
        marginRight: 10,
    },
    transactionText: {
        fontSize: 14,
        color: '#fff',
        fontWeight: 'bold',
        marginBottom: 5,
    },
    userName: {
        fontSize: 12,
        color: '#fff',
        marginBottom: 5,
    },
    date: {
        fontSize: 10,
        color: '#fff',
        marginBottom: 10,
    },
    coinImage: {
        width: 50,
        height: 50,
        objectFit: 'contain',
        marginRight: 5,
    },
    coinAmount: {
        fontSize: 16,
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
    },
})

export default TransactionHistory