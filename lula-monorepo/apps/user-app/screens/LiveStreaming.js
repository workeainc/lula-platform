import React, { useState, useRef, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Dimensions,
    Platform,
    TextInput,
    ScrollView,
    Image,
} from 'react-native';
import { Camera } from 'expo-camera';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const DUMMY_COMMENTS = [
    { id: 1, user: '@johndoe', message: 'Looking great! Keep it up!' },
    { id: 2, user: '@jane_smith', message: 'Love your style! It’s so unique!' },
    { id: 3, user: '@mike123', message: 'Amazing content! I can’t get enough!' },
    { id: 4, user: '@lucy_rose', message: 'You’re so creative, always bringing fresh ideas!' },
    { id: 5, user: '@david_brown', message: 'This is top-tier content. Keep shining!' },
    { id: 6, user: '@emily_green', message: 'Your energy is contagious, love watching you!' },
    { id: 7, user: '@chris_jones', message: 'I’ve learned so much from your posts!' },
    { id: 8, user: '@nina_williams', message: 'Such a vibe! I could watch this all day!' },
    { id: 9, user: '@alex_hall', message: 'Absolutely inspiring! Keep doing what you’re doing!' },
    { id: 10, user: '@sara_miller', message: 'Every post you make is fire 🔥! Keep it coming!' },
    { id: 11, user: '@tom_kelly', message: 'So impressed by your work, keep it up!' },
    { id: 12, user: '@olivia_davis', message: 'This is next-level content. I love your passion!' }
];


export default function LiveStreaming() {
    const [hasPermission, setHasPermission] = useState(null);
    const [type, setType] = useState(Camera.Constants.Type.front);
    const [message, setMessage] = useState('');
    const cameraRef = useRef(null);

    useEffect(() => {
        (async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);

    const handleFlipCamera = () => {
        setType(
            type === Camera.Constants.Type.back
                ? Camera.Constants.Type.front
                : Camera.Constants.Type.back
        );
    };

    if (hasPermission === null) {
        return <View />;
    }
    if (hasPermission === false) {
        return <Text>No access to camera</Text>;
    }

    return (
        <View style={styles.container}>
            <Camera style={styles.camera} type={type} ref={cameraRef}>
                <SafeAreaView style={styles.overlay}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.profileInfo}>
                            <View style={styles.profileImageContainer}>
                                <BlurView intensity={30} style={styles.profileImage}>
                                    <Text style={styles.profileInitial}>J</Text>
                                </BlurView>
                                <View style={styles.liveIndicator}>
                                    <Text style={styles.liveText}>LIVE</Text>
                                </View>
                            </View>
                            <View style={styles.userInfo}>
                                <Text style={styles.username}>@username</Text>
                                <Text style={styles.viewCount}>2.5k watching</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="white" />
                        </TouchableOpacity>
                    </View>

                    {/* Side Actions */}
                    <View style={styles.sideActions}>
                        <TouchableOpacity style={styles.actionButton} onPress={handleFlipCamera}>
                            <Ionicons name="camera-reverse" size={24} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton}>
                            <Ionicons name="share-social" size={24} color="white" />
                        </TouchableOpacity>
                    </View>

                    {/* Comments Section */}
                    <View style={styles.bottomSection}>
                        <ScrollView style={styles.comments} showsVerticalScrollIndicator={false}>
                            {DUMMY_COMMENTS.map((comment) => (
                                <View key={comment.id} style={styles.commentItem}>
                                    <View style={styles.userProfile}>
                                        <Image source={require('../assets/images/avatar.png')} style={styles.userProfileImage} />
                                        <Text style={styles.commentUser}>{comment.user}</Text>
                                    </View>
                                    <Text style={styles.commentText}>{comment.message}</Text>
                                </View>
                            ))}
                        </ScrollView>

                        {/* Message Input */}
                        <View style={styles.messageInputContainer}>
                            <TextInput
                                style={styles.messageInput}
                                placeholder="Say something..."
                                placeholderTextColor="#999"
                                value={message}
                                onChangeText={setMessage}
                            />
                            <TouchableOpacity style={styles.sendButton}>
                                <Ionicons name="send" size={20} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </SafeAreaView>
            </Camera>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    camera: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    profileInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileImageContainer: {
        marginRight: 12,
    },
    profileImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileInitial: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    liveIndicator: {
        position: 'absolute',
        bottom: -5,
        right: -5,
        backgroundColor: '#FF4B4B',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    liveText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    userInfo: {
        flex: 1,
    },
    username: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    viewCount: {
        color: 'white',
        fontSize: 12,
        opacity: 0.8,
    },
    closeButton: {
        padding: 8,
    },
    sideActions: {
        position: 'absolute',
        right: 16,
        bottom: 100,
    },
    actionButton: {
        alignItems: 'center',
        marginVertical: 8,
        width: 40,
        height: 40,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 200,
        backgroundColor: 'rgba(225, 252, 225, 0.3)'
    },
    actionCount: {
        color: 'white',
        fontSize: 12,
        marginTop: 4,
    },
    bottomSection: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
    },
    comments: {
        maxHeight: 200,
        marginBottom: 16,
    },
    commentItem: {
        marginVertical: 4,
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 8,
        maxWidth: '75%',
        borderRadius: 5,
    },
    userProfile: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userProfileImage: {
        width: 24,
        height: 24,
        marginRight: 5,
        objectFit: 'cover',
        borderRadius: 200,
    },
    commentUser: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    },
    commentText: {
        color: 'white',
        fontSize: 12,
    },
    messageInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 24,
        padding: 4,
    },
    messageInput: {
        flex: 1,
        color: 'white',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    sendButton: {
        backgroundColor: '#FF4B4B',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
});