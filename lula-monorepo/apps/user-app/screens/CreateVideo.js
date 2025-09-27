import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons'
import { Video } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import BackendService from '../services/BackendService'; // Use BackendService for upload and post creation
import showToast from '../utils/toast';
import { handleError } from '../utils/function';
import SubmitButton from '../components/ui/SubmitButton'; // Assuming you have a SubmitButton component
import { useSelector } from 'react-redux'; // To get the user ID
import { useNavigation } from '@react-navigation/native'; // To navigate back

const CreateVideo = () => {
    const navigation = useNavigation();
    const { user } = useSelector((state) => state.auth);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [caption, setCaption] = useState(''); // Add caption state for video
    const [videoUri, setVideoUri] = useState(null); // Use videoUri specifically for video

    const pickVideo = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos, // Only allow video selection
            allowsEditing: true, // Keep this if you want editing
            quality: 1,
        });
        if (!result.canceled) {
            setVideoUri(result.assets[0].uri);
        }
    };

    const handleCreateVideoPost = async () => {
        try {
            if (!videoUri) {
                showToast('Please select a video');
                return;
            }
            setIsSubmitting(true);
            const videoUrl = await PostService.uploadFiles(videoUri, '/lula/streamer/videos');

            const response = await PostService.createPost(user.id, 'VIDEO', videoUrl, caption);

            if (!response.error) {
                showToast('Video post created successfully!', 'success');
                navigation.goBack();
            } else {
                showToast(response.message || 'Error creating video post!');
            }
        } catch (error) {
            handleError(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            <View className="flex-row items-center justify-between px-4 py-2">
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back-outline" size={24} color="gray" />
                </TouchableOpacity>
                <Text className="text-lg font-medium">Upload Video</Text>
                <View style={{ width: 24 }} />
            </View>

            <TextInput
                style={styles.input}
                placeholder="Write a caption for your video..."
                value={caption}
                onChangeText={setCaption}
            />
            <TouchableOpacity style={styles.mediaPicker} onPress={pickVideo}>
                {videoUri ? (
                    <Video
                        source={videoUri && typeof videoUri === 'string' && videoUri.trim() !== '' ? { uri: videoUri } : require('../assets/images/avatar.png')}
                        style={styles.mediaPreview}
                        useNativeControls
                        resizeMode="contain"
                        isLooping={false}
                    />
                ) : (
                    <Text>Select Video</Text>
                )}
            </TouchableOpacity>
            <SubmitButton
                loading={isSubmitting}
                title={'Upload Video'}
                onPress={handleCreateVideoPost}
                disabled={!videoUri || isSubmitting}
            />
             {/* Add loading indicator */}
            {isSubmitting && (
                <ActivityIndicator style={{ marginTop: 20 }} size="large" color="#0000ff" />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#fff' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
    input: { borderWidth: 1, padding: 10, marginBottom: 10, borderRadius: 5 },
    mediaPicker: { height: 200, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    mediaPreview: { width: '100%', height: '100%', resizeMode: 'cover' }, // Use cover for full preview
});

export default CreateVideo;
