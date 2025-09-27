// EditPost.js
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import BackendService from '../services/BackendService';
import { handleError } from '../utils/function';
import showToast from '../utils/toast'

const EditPost = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { post } = route.params;

    const [caption, setCaption] = useState(post.caption);
    const [mediaUrl, setMediaUrl] = useState(post.mediaUrl);
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        try {
            const updatedPost = { ...post, caption, mediaUrl };
            const response = await PostService.updatePost(updatedPost);

            // Correctly check for success using !response.error
            if (!response.error) {
                // You can pass the updated post back to the previous screen if needed
                // For example, using navigation.goBack() with params,
                // but the useFocusEffect in StreamerProfile will handle refetching.
                showToast(response.message, 'success')
                navigation.goBack();
            } else {
                handleError(response.message); // Use response.message for error details
            }
        } catch (error) {
            console.log(error);
            handleError(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigation.goBack();
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Edit Post</Text>

            <TextInput
                style={styles.input}
                placeholder="Caption"
                value={caption}
                onChangeText={setCaption}
            />

            {mediaUrl && (
                <Image
                    source={mediaUrl && typeof mediaUrl === 'string' && mediaUrl.trim() !== '' ? { uri: mediaUrl } : require('../assets/images/avatar.png')}
                    style={styles.mediaPreview}
                    resizeMode="contain"
                />
            )}

            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={handleCancel}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.button, styles.saveButton]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    <Text style={[styles.buttonText, styles.saveButtonText]}>
                        {loading ? 'Saving...' : 'Save'}
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        marginBottom: 15,
        fontSize: 16,
    },
    mediaPreview: {
        width: '100%',
        height: 200,
        marginBottom: 15,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 20,
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 5,
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 5,
    },
    cancelButton: {
        backgroundColor: '#ccc',
    },
    saveButton: {
        backgroundColor: '#6200EE',
    },
    buttonText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: 'bold',
    },
    saveButtonText: {
        color: '#fff',
    }
});

export default EditPost;