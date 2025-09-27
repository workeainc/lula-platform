import React, { useState, useEffect } from 'react'
import { View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity, Image, Dimensions, Modal } from 'react-native'
import avatar from '../assets/images/men.png'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { LinearGradient } from 'expo-linear-gradient'
import { useNavigation, useRoute } from '@react-navigation/native'
import NewAuthService from '../services/NewAuthService'
import NewChatService from '../services/NewChatService'
import { handleError } from '../utils/function'
import { useSelector } from 'react-redux'

const { width: screenWidth, height: screenHeight } = Dimensions.get('window')

const Chat = () => {
    const { user } = useSelector((state) => state.auth)
    const [data, setData] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const route = useRoute()
    const chatId = route?.params?.chatId
    const [messages, setMessages] = useState([])
    const [message, setMessage] = useState('')
    const navigation = useNavigation()

    if (!chatId) {
        return (
            <View style={[styles.container, { backgroundColor: 'rgba(171, 73, 161, 0.9)' }]}>
                <View style={styles.header}>
                    <Text style={styles.headerText}>Messages</Text>
                    <Image source={avatar} style={styles.image} />
                </View>
                <View style={styles.content}>
                    <View style={styles.loadingContainer}>
                        <Text style={styles.loadingText}>No chat selected</Text>
                    </View>
                </View>
            </View>
        )
    }

    useEffect(() => {
        if (!chatId) {
            return
        }

        let unsubscribe = null
        try {
            unsubscribe = ChatService.listenToMessages(chatId, (messages) => {
                setMessages(messages || [])
            })
        } catch (error) {
            console.error('Error setting up message listener:', error)
        }

        const getData = async () => {
            try {
                setIsLoading(true)
                const res = await AuthService.getUser(user.id)
                if (!res.error) {
                    setData(res.user)
                }
            } catch (error) {
                console.error('Error loading user data:', error)
                handleError(error)
            } finally {
                setIsLoading(false)
            }
        }
        getData()
        
        return () => {
            if (typeof unsubscribe === 'function') {
                try {
                    unsubscribe()
                } catch (error) {
                    console.error('Error cleaning up listener:', error)
                }
            }
        }
    }, [chatId, user?.id])

    const handleSendMessage = async() => {
        try {
            if (!message.trim()) {
                return
            }

            const body = {
                attachments: [],
                content: message,
                read: false,
                sender: 'STREAMER',
                senderId: user.id,
            }

            setMessage("")

            await ChatService.sendMessage(chatId,body)

        } catch (error) {
            handleError(error)
        }
    }

    const renderItem = ({ item }) => (
        <View style={[styles.messageContainer, item.sender === 'USER' ? styles.user1Message : styles.user2Message]}>
            <Text style={styles.messageText}>{item.content}</Text>
        </View>
    )

    return (
        <View style={[styles.container, { backgroundColor: 'rgba(171, 73, 161, 0.9)' }]}>
            <View style={styles.header}>
                <Text style={styles.headerText}>Messages</Text>
                <Image source={data?.profileUri && typeof data.profileUri === 'string' && data.profileUri.trim() !== '' ? { uri: data.profileUri } : avatar} style={styles.image} />
            </View>
            <View style={styles.content}>
                {chatId ? (
                    <>
                        <FlatList
                            data={messages}
                            renderItem={renderItem}
                            keyExtractor={(item) => String(item.id)}
                            style={styles.messageList}
                            removeClippedSubviews={false}
                            keyboardShouldPersistTaps="handled"
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>No messages yet</Text>
                                </View>
                            }
                        />
                        <View style={styles.inputContainer}>
                            <TextInput 
                                style={styles.input} 
                                placeholder="Type message here..." 
                                value={message} 
                                onChangeText={(text) => setMessage(text)} 
                                onSubmitEditing={handleSendMessage} 
                            />
                            <TouchableOpacity onPress={handleSendMessage}>
                                <View style={[styles.sendButton, { backgroundColor: '#CE54C1' }]}>
                                    <FontAwesome name="send" size={20} color="white" />
                                </View>
                            </TouchableOpacity>
                        </View>
                    </>
                ) : (
                    <View style={styles.loadingContainer}>
                        <Text style={styles.loadingText}>Loading chat...</Text>
                    </View>
                )}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    headerText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    image: {
        width: 35,
        height: 35,
        objectFit: 'cover',
        borderRadius: 100,
    },
    content: {
        flex: 1,
        width: '100%',
        backgroundColor: '#fff',
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
    },
    messageList: {
        flex: 1,
        paddingBottom: 60,
    },
    messageContainer: {
        marginVertical: 8,
        marginHorizontal: 16,
        padding: 12,
        borderRadius: 10,
    },
    user1Message: {
        backgroundColor: '#5734D3',
        alignSelf: 'flex-start',
        maxWidth: '70%',
        borderRadius: 30,
        borderBottomLeftRadius: 0,
    },
    user2Message: {
        backgroundColor: '#CE54C1',
        alignSelf: 'flex-end',
        maxWidth: '70%',
        borderRadius: 30,
        borderBottomRightRadius: 0,
    },
    messageText: {
        color: 'white',
        fontSize: 12,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: '#eaeaea',
        backgroundColor: 'white',
    },
    input: {
        flex: 1,
        height: 40,
        borderColor: '#eaeaea',
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 12,
        fontSize: 16,
        width: screenWidth * 0.8,
    },
    sendButton: {
        padding: 10,
        width: screenWidth * 0.2,
        borderRadius: 25,
        marginLeft: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
    },
})

export default Chat
