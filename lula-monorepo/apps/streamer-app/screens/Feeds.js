import React, { useState } from 'react';
import { StyleSheet, Text, View, ImageBackground, TouchableOpacity, useWindowDimensions, Image, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import EvilIcons from '@expo/vector-icons/EvilIcons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { TabView } from 'react-native-tab-view';

const FeedsSection = () => {
    const navigation = useNavigation();
    const [likes, setLikes] = useState(0);
    const [comments, setComments] = useState(0);
    const handleLike = () => setLikes(likes + 1);
    const handleComment = () => setComments(comments + 1);
    const posts = [
        {
            id: 1,
            name: 'Nova',
            location: 'Bangalore',
            image: { uri: 'https://plus.unsplash.com/premium_photo-1664351560745-a14ed7bfee3d?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8Z2lybHMlMjBwaG90b3xlbnwwfHwwfHx8MA%3D%3D' }, // Placeholder image link
            text: 'Exploring the vibrant streets of Bangalore today! 🌆',
        },
        {
            id: 2,
            name: 'Riya',
            location: 'Mumbai',
            image: { uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSIZGdzyhilxC8XcYbpeM6AgZtsG9YTnPpsNA&s' }, // Placeholder image link with color
            text: 'Loving the monsoon vibes in Mumbai! 🌧️',
        },
        {
            id: 3,
            name: 'Arjun',
            location: 'Delhi',
            image: { uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTewBf4HJge_z508pGH5yF1i5AwsDZz9OlesA&s' },
            text: 'Delhi’s food scene is unbeatable! 🍲',
        },
        {
            id: 4,
            name: 'Priya',
            location: 'Chennai',
            image: { uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQPTf60mv3VeYXJg37aEFDqWIzA8DNhRnU02w&s' }, // Placeholder image link with color
            text: 'Chennai’s beaches are so serene. �',
        },
        {
            id: 5,
            name: 'Karan',
            location: 'Hyderabad',
            image: { uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQiQjwcR2Pw9t_GJJplEmVddCm3gVVibq6IeA&s' }, // Placeholder image link with color
            text: 'Biryani in Hyderabad is a must-try! �',
        },
    ];
    return (
        <ScrollView style={styles.feedList} showsVerticalScrollIndicator={false}>
            {posts.map(post => (
                <LinearGradient
                    key={post.id}
                    colors={['#4158D0', '#C850C0']}
                    style={styles.postContainer}
                >
                    <View style={styles.mainHeader}>
                        <TouchableOpacity style={styles.postHeader} onPress={() => navigation.navigate('StreamerProfile')}>
                            <Image source={post.image} style={styles.postImage} />
                            <View style={styles.postInfo}>
                                <Text style={styles.postName}>{post.name}</Text>
                                <Text style={styles.postLocation}><EvilIcons name="location" size={12} color="white" />{post.location}</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.videoHeader} onPress={() => navigation.navigate('LiveStreaming')}>
                            <FontAwesome name="video-camera" size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.postText}>{post.text}</Text>
                    <Image source={post.image} style={styles.postMainImage} />
                    <View style={styles.postActions}>
                        <TouchableOpacity style={styles.likeButton} onPress={handleLike}>
                            <FontAwesome name="heart" size={20} color="white" />
                            <Text style={styles.actionText}>{likes} Likes</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.commentButton} onPress={handleComment}>
                            <FontAwesome5 name="comment" size={20} color="white" />
                            <Text style={styles.actionText}>{comments} Comments</Text>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
            ))}
        </ScrollView>
    );
}



const Videos = () => {
    const navigation = useNavigation();
    const [likes, setLikes] = useState(0);
    const [comments, setComments] = useState(0);
    const handleLike = () => setLikes(likes + 1);
    const handleComment = () => setComments(comments + 1);
    const posts = [
        {
            id: 1,
            name: 'Nova',
            location: 'Bangalore',
            image: { uri: 'https://plus.unsplash.com/premium_photo-1664351560745-a14ed7bfee3d?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8Z2lybHMlMjBwaG90b3xlbnwwfHwwfHx8MA%3D%3D' }, // Placeholder image link
            text: 'Exploring the vibrant streets of Bangalore today! 🌆',
        },
        {
            id: 2,
            name: 'Riya',
            location: 'Mumbai',
            image: { uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSIZGdzyhilxC8XcYbpeM6AgZtsG9YTnPpsNA&s' }, // Placeholder image link with color
            text: 'Loving the monsoon vibes in Mumbai! 🌧️',
        },
        {
            id: 3,
            name: 'Arjun',
            location: 'Delhi',
            image: { uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTewBf4HJge_z508pGH5yF1i5AwsDZz9OlesA&s' },
            text: 'Delhi’s food scene is unbeatable! 🍲',
        },
        {
            id: 4,
            name: 'Priya',
            location: 'Chennai',
            image: { uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQPTf60mv3VeYXJg37aEFDqWIzA8DNhRnU02w&s' }, // Placeholder image link with color
            text: 'Chennai’s beaches are so serene. �',
        },
        {
            id: 5,
            name: 'Karan',
            location: 'Hyderabad',
            image: { uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQiQjwcR2Pw9t_GJJplEmVddCm3gVVibq6IeA&s' }, // Placeholder image link with color
            text: 'Biryani in Hyderabad is a must-try! �',
        },
    ];
    return (
        <ScrollView style={styles.feedList} showsVerticalScrollIndicator={false}>
            {posts.map(post => (
                <LinearGradient
                    key={post.id}
                    colors={['#4158D0', '#C850C0']}
                    style={styles.postContainer}
                >
                    <View style={styles.mainHeader}>
                        <TouchableOpacity style={styles.postHeader} onPress={() => navigation.navigate('StreamerProfile')}>
                            <Image source={post.image} style={styles.postImage} />
                            <View style={styles.postInfo}>
                                <Text style={styles.postName}>{post.name}</Text>
                                <Text style={styles.postLocation}><EvilIcons name="location" size={12} color="white" />{post.location}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.postText}>{post.text}</Text>
                    <Image source={post.image} style={styles.postMainImage2} />
                    <View style={styles.postActions}>
                        <TouchableOpacity style={styles.likeButton} onPress={handleLike}>
                            <FontAwesome name="heart" size={20} color="white" />
                            <Text style={styles.actionText}>{likes} Likes</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.commentButton} onPress={handleComment}>
                            <FontAwesome5 name="comment" size={20} color="white" />
                            <Text style={styles.actionText}>{comments} Comments</Text>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
            ))}
        </ScrollView>
    );
}



const Feeds = () => {
    const layout = useWindowDimensions();
    const [index, setIndex] = useState(0);
    const [routes] = useState([
        { key: 'FEEDS', title: 'Feeds' },
        { key: 'VIDEOS', title: 'Videos' },
    ]);

    const renderScene = ({ route }) => {
        switch (route.key) {
            case 'FEEDS':
                return <FeedsSection />;
            case 'VIDEOS':
                return <Videos />;
            default:
                return null;
        }
    };

    return (
        <LinearGradient
            colors={['rgba(97, 86, 226, 0.9)', 'rgba(171, 73, 161, 0.9)']}
            style={styles.gradient}
        >
            <TabView
                style={styles.tabContainer}
                navigationState={{ index, routes }}
                renderScene={renderScene}
                onIndexChange={setIndex}
                initialLayout={{ width: layout.width }}
                renderTabBar={(props) => {
                    return (
                        <>
                            <View style={styles.tabBar}>
                                {props.navigationState.routes.map((route, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        style={[styles.tabItem, index === i && styles.activeTabItem]}
                                        onPress={() => setIndex(i)}
                                    >
                                        <Text style={styles.heading}>{route.title}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <Image source={require('../assets/images/men.png')} style={styles.userImage} />
                        </>
                    );
                }}
            />
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
        width: '100%',
        paddingHorizontal: 15,
    },
    content: {
        width: '90%',
    },
    header: {
        marginTop: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    tabBar: {
        flexDirection: 'row',
        marginTop: 20,
    },
    userImage: {
        width: 40,
        height: 40,
        borderRadius: 200,
        position: 'absolute',
        top: 10,
        right: 0,
    },
    heading: {
        color: 'white',
        fontSize: 16,
        marginRight: 10,
        fontWeight: 'bold',
    },
    feedList: {
        marginTop: 20,
        marginBottom: 40,
        width: '100%',
    },
    postContainer: {
        marginBottom: 20,
        borderRadius: 10,
        padding: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: '#A6A6A6',
    },
    mainHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    postImage: {
        width: 45,
        height: 45,
        borderWidth: 1,
        borderColor: '#fff',
        borderRadius: 200,
    },
    postInfo: {
        marginLeft: 10,
    },
    postName: {
        fontSize: 16,
        color: '#fff',
        fontWeight: 'bold',
    },
    postLocation: {
        fontSize: 12,
        color: '#EEE',
    },
    videoHeader: {
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        width: 40,
        height: 40,
        borderRadius: 200,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    postText: {
        marginTop: 10,
        fontSize: 12,
        color: '#fff',
    },
    postMainImage: {
        width: '100%',
        height: 200,
        objectFit: 'cover',
        marginTop: 10,
        borderRadius: 10,
        backgroundColor: '#fff',
    },
    postMainImage2: {
        width: '100%',
        height: 350,
        objectFit: 'cover',
        marginTop: 10,
        borderRadius: 10,
        backgroundColor: '#fff',
    },
    postActions: {
        flexDirection: 'row',
        marginTop: 10,
    },
    likeButton: {
        borderRadius: 5,
        flexDirection: 'row',
        marginRight: 20,
        alignItems: 'center',
    },
    commentButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 5,
    },
    actionText: {
        color: '#fff',
        marginLeft: 10,
    },
    stats: {
        marginTop: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statsText: {
        fontSize: 12,
        color: 'gray',
    },
});

export default Feeds;