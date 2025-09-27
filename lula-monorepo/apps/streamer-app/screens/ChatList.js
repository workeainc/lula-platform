import React, { useState, useEffect } from 'react'
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import avatarMen from '../assets/images/avatar.png' // Your default avatar image
import avatar from '../assets/images/men.png' // Your default avatar image
import NewAuthService from '../services/NewAuthService'
import NewChatService from '../services/NewChatService' // Use NewChatService for getChatList method
import { useSelector } from 'react-redux'
import { formatDate } from '../utils/function'

const ChatList = () => {
    const { user } = useSelector((state) => state.auth)
    const [data, setData] = useState(null)
    const navigation = useNavigation()
    const [messages, setMessages] = useState([]) // Store messages
    const [lastVisible, setLastVisible] = useState(null) // Store last visible for pagination
    const [loading, setLoading] = useState(false) // For loading indicator
    const [refreshing, setRefreshing] = useState(false)

    // Fetch chats when component mounts or when pagination triggers
    const fetchChats = async (reset = false) => {
        if (loading) return // Prevent multiple requests simultaneously
        setLoading(true)

        try {
            const result = await ChatService.getChatList(10, reset ? null : lastVisible, user.id) // replace 'streamerId' with actual streamer ID
            setMessages((prevMessages) => (reset ? result.chats : [...prevMessages, ...result.chats])) // Append new messages to the existing list
            setLastVisible(result.lastVisible) // Update lastVisible for pagination
        } catch (error) {
            console.error('Error fetching chats:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleRefresh = async () => {
        setRefreshing(true)
        setMessages([])
        setLastVisible(null)
        await fetchChats(true)
        setRefreshing(false)
    }

    // Trigger fetchChats when component mounts
    useEffect(() => {
        fetchChats()
        const getData = async () => {
            try {
                setLoading(true)
                const res = await AuthService.getUser(user.id)
                if (!res.error) {
                    setData(res.user)
                }
            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }
        getData()
    }, [])

    // Render each chat item in FlatList
    const renderChatItem = ({ item }) => (
        <TouchableOpacity
            style={styles.chatItem}
            onPress={() => {
                console.log('Navigating to Chat with item:', item)
                console.log('Chat ID:', item.id)
                navigation.navigate('Chat', { chatId: item.id })
            }}
        >
            <Image
                source={item.user?.profileUri && typeof item.user.profileUri === 'string' && item.user.profileUri.trim() !== '' ? { uri: item.user.profileUri } : avatarMen}
                style={styles.image}
            />
            <View style={styles.textContainer}>
                <Text style={styles.name}>{item.user?.name || 'Anonymous User'}</Text>
                <Text style={styles.message}>{item.lastMessage}</Text>
            </View>
            <Text style={styles.time}>{formatDate(item.updatedAt)}</Text>
        </TouchableOpacity>
    )

    return (
        <LinearGradient
            colors={['rgba(171, 73, 161, 0.9)', 'rgba(97, 86, 226, 0.9)']}
            style={styles.gradient}
        >
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Chats</Text>
                <View style={styles.headerIcons}>
                    <TouchableOpacity
                        style={styles.headerIconsTab}
                        onPress={() => navigation.navigate('Analytics')}
                    >
                        <MaterialIcons name="analytics" size={29} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('StreamerProfile')}>
                        <Image
                            source={data?.profileUri && typeof data.profileUri === 'string' && data.profileUri.trim() !== '' ? { uri: data.profileUri } : avatar}
                            style={styles.headerIconsImage}
                        />
                    </TouchableOpacity>
                </View>
            </View>
            <View style={styles.content}>
                <FlatList
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderChatItem}
                    // onEndReached={fetchChats} // Load more chats when reaching the end
                    // onEndReachedThreshold={0.5} // Threshold for triggering `onEndReached`
                    style={styles.messagesContent}
                    ListFooterComponent={loading ? (
                        <View style={styles.loading}>
                            <Text>Loading...</Text>
                        </View>
                    ) : null}
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                />
            </View>
        </LinearGradient>
    )
}

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
    },
    loading: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
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
        backgroundColor: '#fff',
        borderTopLeftRadius: 15,
        height: '100%',
        borderTopRightRadius: 15,
    },
    chatItem: {
        flexDirection: 'row',
        padding: 10,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    image: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    textContainer: {
        marginLeft: 10,
        flex: 1,
    },
    name: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    message: {
        color: 'gray',
        fontSize: 12,
    },
    time: {
        color: 'gray',
        fontSize: 12,
    },
    messagesContent: {
        flex: 1,
    },
    headerIconsTab: {
        marginRight: 10,
    },
})

export default ChatList
