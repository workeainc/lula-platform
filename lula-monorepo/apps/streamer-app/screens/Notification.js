import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ImageBackground, TouchableOpacity, Animated, FlatList, ScrollView, Image, Dimensions, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const Notification = () => {
    const navigation = useNavigation();

    const notifications = [
        { id: '1', type: 'follow', user: 'Mr. Jimmy', time: '5 hours ago', image: require('../assets/images/login/bg.png') },
        { id: '2', type: 'live', user: 'Roy Niger', time: '30 minutes ago', image: require('../assets/images/login/bg.png') },
        { id: '3', type: 'like', user: 'Johnson', time: '5 hours ago', image: require('../assets/images/login/bg.png') },
        { id: '4', type: 'join', user: 'James Anderson', time: 'Just now', image: require('../assets/images/login/bg.png') },
    ];


    const renderNotification = ({ item }) => (
        <View style={styles.notificationItem}>
            <Image source={item.image} style={styles.image}/>
            <View>
                <Text style={styles.notificationText}>
                    {item.type === 'follow' && `${item.user} started following you.`}
                    {item.type === 'live' && `${item.user} started a live video.`}
                    {item.type === 'like' && `${item.user} liked your post and shared it.`}
                    {item.type === 'join' && `${item.user} wants to join your group.`}
                </Text>
                <Text style={styles.notificationTime}>{item.time}</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header} className={'mb-5'}>
                <Text style={styles.mediumText} className={'text-center'}>Notification</Text>
            </View>
            <FlatList
                data={notifications}
                renderItem={renderNotification}
                keyExtractor={item => item.id}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    notificationItem: {
        paddingVertical: 10,
        paddingHorizontal: 8,
        marginBottom: 10,
        borderRadius: 5,
        backgroundColor: '#f9f9f9',
        flexDirection: 'row',
        alignItems: 'center',
    },
    notificationText: {
        fontSize: 13,
    },
    notificationTime: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    image: {
        width: 50,
        height: 50,
        marginRight: 10,
        objectFit: 'cover',
        borderRadius: 200,
    },
    mediumText: {
        fontSize: 18,
        fontWeight: '600',
    },
});

export default Notification;