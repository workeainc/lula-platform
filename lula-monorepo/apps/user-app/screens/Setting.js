import React, { useState } from 'react'
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { Entypo, FontAwesome5, MaterialIcons, FontAwesome } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'

const Setting = () => {
    const navigation = useNavigation()

    const options = [
        {
            name: 'Transaction History',
            icon: <FontAwesome5 name="exchange-alt" size={20} color="#000" />,
            onPress: () => navigation.navigate('TransactionHistory'),
        },
        {
            name: 'Privacy Policy',
            icon: <FontAwesome5 name="shield-alt" size={20} color="#000" />,
            onPress: () => navigation.navigate('PrivacyPolicy'),
        },
        {
            name: 'About Us',
            icon: <FontAwesome5 name="info-circle" size={20} color="#000" />,
            onPress: () => navigation.navigate('About'),
        },
        {
            name: 'Logout',
            icon: <FontAwesome5 name="sign-out-alt" size={20} color="#000" />,
            onPress: () => navigation.navigate('Logout'),
        }
    ];

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerText}>Setting</Text>
            </View>
            <View style={styles.boxes}>
                {options.map((option, index) => (
                    <TouchableOpacity key={index} onPress={option.onPress} style={styles.button}>
                        <View style={styles.buttonInner}>
                            {option.icon}
                            <Text style={styles.buttonText}>{option.name}</Text>
                        </View>
                        <Entypo name="chevron-small-right" size={24} color="black" />
                    </TouchableOpacity>
                ))}
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
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    headerText: {
        fontSize: 18,
        fontWeight: 600,
        textAlign: 'center',
    },
    boxes: {
        flex: 1,
        paddingHorizontal: 20,
        backgroundColor: '#fff',
        paddingBottom: 60,
    },
    button: {
        backgroundColor: '#fff',
        paddingHorizontal: 10,
        paddingVertical: 15,
        borderRadius: 5,
        flexDirection: 'row',
        borderWidth: 0.5,
        borderColor: 'grey',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    buttonInner: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    buttonText: {
        marginLeft: 10,
    },
})

export default Setting