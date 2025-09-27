import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import NewCallService from '../services/NewCallService';
import NewUserService from '../services/NewUserService';
import { useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native'
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const CallLogScreen = () => {
    const [callLogs, setCallLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation()

    const { user } = useSelector((state) => state.auth);
    const currentUserId = user?.id;

    useEffect(() => {
        const fetchCallLogs = async () => {
            if (!currentUserId) {
                setLoading(false);
                return;
            }
            try {
                const response = await CallService.getCallLogs(currentUserId);
                if (!response.error && response.data) {
                    const logsWithUserData = await Promise.all(response.data.map(async (log) => {
                        const otherUserId = log.callerId === currentUserId ? log.receiverId : log.callerId;
                        // Use the new getUserById method
                        const userResponse = await UserService.getUserById(otherUserId);
                        return {
                            ...log,
                            otherParticipant: userResponse.user // Assuming userResponse.user contains the user data
                        };
                    }));
                    setCallLogs(logsWithUserData);
                } else {
                    console.error("Error fetching call logs:", response.message);
                }
            } catch (error) {
                console.error("An unexpected error occurred while fetching call logs:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCallLogs();
    }, [currentUserId]);

    const handleCallPress = (participantId) => {
      // Implement your call initiation logic here
      console.log('Initiating call with:', participantId);
      // Example: Navigate to your call screen with the participantId
      navigation.navigate('Call', { userId: participantId })
    };

    const renderItem = ({ item }) => {
        if (!item || !item.otherParticipant) {
            return null;
        }

        const isCaller = item.callerId === currentUserId;
        const participantName = item.otherParticipant.name || 'Unknown User';
        const participantImage = item.otherParticipant.profileUri ? { uri: item.otherParticipant.profileUri } : require('../assets/images/avatar.png');
        const callType = isCaller ? 'Outgoing Call' : 'Incoming Call';

        return (
            <View style={styles.logItem}>
                <View style={styles.logItemContent}>
                    <View style={styles.participantInfo}>
                        <Image source={participantImage} style={styles.participantImage} />
                        <View style={styles.nameAndTime}>
                            <Text style={styles.participantName}>{participantName}</Text>
                            <Text style={styles.callDetailsText}>
                                {callType} - {item.startTime?.toLocaleString()}
                                {item.endTime && ` - ${item.endTime.toLocaleString()}`}
                            </Text>
                            {item.duration !== undefined && item.duration !== null && (
                                <Text style={styles.callDetailsText}>Duration: {item.duration} seconds</Text>
                            )}
                        </View>
                    </View>
                    <TouchableOpacity onPress={() => handleCallPress(item.otherParticipant.id)} style={styles.callButton}>
                        <MaterialIcons name="call" size={24} color="green" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text>Loading call logs...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Call History</Text>
            {callLogs.length > 0 ? (
                <FlatList
                    data={callLogs}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                />
            ) : (
                <Text>No call logs found.</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    logItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        marginBottom: 8,
    },
    logItemContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    participantInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 10,
    },
    participantImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    nameAndTime: {
        flex: 1,
    },
    participantName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    callDetailsText: {
        fontSize: 12,
        color: '#555',
    },
    callButton: {
        padding: 8,
    },
});

export default CallLogScreen;
