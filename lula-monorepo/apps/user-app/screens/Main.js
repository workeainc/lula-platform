import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native'
import APKDownloadCard from '../components/ui/APKDownloadCard';

export default function Main() {
    const navigation = useNavigation()

    return (
        <ScrollView style={styles.container}>
            <View style={styles.stepContainer}>
                <View style={styles.profileImageContainer}>
                    <View style={styles.imageWrapper}>
                        <Image
                            source={require('../assets/images/women.png')}
                            style={styles.profileImage}
                        />
                    </View>
                </View>

                <Image
                    source={require('../assets/images/welcome.png')}
                    style={styles.welcomeImage}
                />
                <Text style={styles.title3}>Riya Khan</Text>
                <Text style={styles.subtitle}>Welcome! Your profile is complete. Enjoy a personalized experience ahead!</Text>
                
                {/* APK Download Section */}
                <APKDownloadCard appType="user" />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    profileImageContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    imageWrapper: {
        width: 200,
        height: 200,
    },
    profileImage: {
        width: 200,
        height: 200,
        borderRadius: 500,
        marginBottom: 20,
    },
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 40,
    },
    stepContainer: {
        flex: 1,
        alignItems: 'center',
    },
    welcomeImage: {
        width: '80%',
        objectFit: 'contain',
        marginVertical: 30,
    },
    title3: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
    },
    nextButton: {
        width: '100%',
        height: 50,
        backgroundColor: '#8A2BE2',
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    nextButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});