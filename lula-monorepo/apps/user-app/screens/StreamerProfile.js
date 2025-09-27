import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    Appearance,
    FlatList,
    Modal,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Feather from '@expo/vector-icons/Feather';
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';
import { Entypo, Ionicons, FontAwesome } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Video } from 'expo-av';
import showToast from '../utils/toast'
import NewAuthService from '../services/NewAuthService';
import BackendService from '../services/BackendService';
import { handleError } from '../utils/function';
import Loading from '../components/shared/Loading';
import coinImage from '../assets/images/coin.png';
import RBSheet from 'react-native-raw-bottom-sheet';

// Custom Dropdown Component
const DropdownMenu = ({ visible, onClose, onEdit, onDelete, dropdownTop, dropdownLeft }) => {
    if (!visible) return null;

    return (
        <Modal
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.overlay}
                onPress={onClose}
                activeOpacity={1}
            >
                <View style={[styles.dropdown, { top: dropdownTop, left: dropdownLeft }]}>
                    <TouchableOpacity onPress={onEdit} style={styles.dropdownItem}>
                        <Text style={styles.dropdownItemText}>Edit Post</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onDelete} style={styles.dropdownItem}>
                        <Text style={styles.dropdownItemText}>Delete Post</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

// Removed nested Posts FlatList to avoid nesting inside a ScrollView

// Animated Stat Item Component
const StatItem = ({ icon, value, label, onPress }) => {
    const scale = useSharedValue(1);
    const theme = Appearance.getColorScheme();

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <TouchableOpacity
            onPressIn={() => (scale.value = withSpring(0.95))}
            onPressOut={() => (scale.value = withSpring(1))}
            onPress={onPress}
            accessibilityLabel={`${label}: ${value}`}
            accessibilityRole="button"
        >
            <View style={styles.statCardMain} >
                <Animated.View style={[styles.statCard, animatedStyle]}>
                    {icon}
                    <Text
                        style={[styles.statValue, { color: '#000' }]}
                        allowFontScaling={true}
                    >
                        {value}
                    </Text>
                    <Text
                        style={[styles.statLabel, { color: '#000' }]}
                        allowFontScaling={true}
                    >
                        {label}
                    </Text>
                </Animated.View>
            </View>
        </TouchableOpacity>
    );
};

// Animated Action Button Component
const ActionButton = ({ title, onPress }) => {
    const scale = useSharedValue(1);
    const theme = Appearance.getColorScheme();

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <TouchableOpacity
            onPressIn={() => (scale.value = withSpring(0.9))}
            onPressOut={() => (scale.value = withSpring(1))}
            onPress={onPress}
            style={styles.buttonContainer}
            accessibilityLabel={title}
            accessibilityRole="button"
        >
            <Animated.View style={[animatedStyle]}>
                <LinearGradient colors={['#CE54C1', '#6156E2']} style={styles.button}>
                    <Text
                        style={[styles.buttonText, { color: theme === ' DARK' ? '#fff' : '#fff' }]}
                        allowFontScaling={true}
                    >
                        {title}
                    </Text>
                </LinearGradient>
            </Animated.View>
        </TouchableOpacity>
    );
};

// Main StreamerProfile Component
const StreamerProfile = () => {
    const { user } = useSelector((state) => state.auth);
    const navigation = useNavigation();
    const [data, setData] = useState(null);
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [theme, setTheme] = useState(Appearance.getColorScheme());
    const [tab, setTab] = useState('All');
    const [dropdownVisible, setDropdownVisible] = useState(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
    const [postToDelete, setPostToDelete] = useState(null);
    const deleteRBSheetRef = useRef();
    const dotsRef = useRef({});

    useEffect(() => {
        const subscription = Appearance.addChangeListener(({ colorScheme }) => {
            setTheme(colorScheme);
        });
        return () => subscription.remove();
    }, []);

    useFocusEffect(
        useCallback(() => {
            const getData = async () => {
                try {
                    setIsLoading(true);
                    const [userRes, postsRes] = await Promise.all([
                        AuthService.getUser(user.id),
                        PostService.getPosts(user.id),
                    ]);
                    if (!userRes.error) {
                        setData(userRes.user);
                    }
                    if (!postsRes.error) {
                        setPosts(postsRes.data);
                    }
                } catch (error) {
                    handleError(error);
                } finally {
                    setIsLoading(false);
                }
            };
            getData();
        }, [user.id])
    );

    const handleEditProfile = useCallback(() => {
        navigation.navigate('EditProfile');
    }, [navigation]);

    const handleEditPost = (post) => {
        setDropdownVisible(null);
        navigation.navigate('EditPost', { post: post });
    };

    const handleDeletePost = (post) => {
        setPostToDelete(post);
        setDropdownVisible(null);
        deleteRBSheetRef.current.open();
    };

    const confirmDelete = async () => {
        if (!postToDelete) {
            console.warn('No post selected for deletion.');
            return;
        }
        try {
            const result = await PostService.deletePost(postToDelete.id);
            if (!result.error) {
                setPosts(prevPosts => prevPosts.filter(post => post.id !== postToDelete.id));
                showToast(result.message, 'success');
            }
        } catch (error) {
            handleError(error);
        } finally {
            deleteRBSheetRef.current.close();
            setPostToDelete(null);
        }
    };

    const handleDotsPress = (postId) => {
        dotsRef.current[postId].measureInWindow((x, y, width, height) => {
            const dropdownWidth = 120;
            const calculatedLeft = x + width - dropdownWidth;
            const calculatedTop = y + height;
            setDropdownPosition({ top: calculatedTop, left: calculatedLeft });
            setDropdownVisible(postId);
        });
    };

    const filteredPosts = posts.filter((post) => {
        if (tab === 'All') return true;
        if (tab === 'Images') return post.type === 'FEED';
        return post.type === 'VIDEO';
    });

    return (
        <>
            {isLoading ? (
                <Loading isVisible={true} />
            ) : (
                <>
                <FlatList
                    style={[styles.container]}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    data={filteredPosts}
                    keyExtractor={(item) => item.id}
                    ListEmptyComponent={() => (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No posts found</Text>
                        </View>
                    )}
                    ListHeaderComponent={(
                        <>
                            <LinearGradient
                                colors={['#F1F1FE', '#F8F8FF']}
                                style={styles.profileHeader}
                            >
                                <TouchableOpacity
                                    onPress={() => navigation.navigate('Menu')}
                                    accessibilityLabel="Open menu"
                                    accessibilityRole="button"
                                    style={styles.header}
                                >
                                    <Entypo name="dots-three-vertical" size={20} color={'#000'} />
                                </TouchableOpacity>
                                <View style={styles.profileImageContainer}>
                                    <Image
                                        source={
                                            data?.profileUri && typeof data.profileUri === 'string' && data.profileUri.trim() !== '' ? { uri: data.profileUri } : require('../assets/images/avatar.png')
                                        }
                                        style={styles.profileImage}
                                        accessibilityLabel="Profile picture"
                                    />
                                    <TouchableOpacity
                                        style={styles.profileRing}
                                        onPress={handleEditProfile}
                                        accessibilityLabel="Edit profile"
                                        accessibilityRole="button"
                                    >
                                        <FontAwesome name="edit" size={16} color="#fff" />
                                    </TouchableOpacity>
                                    {/* Quality indicator for high-quality images */}
                                    {data?.profileUri && data.profileUri.includes('4096') && (
                                        <View style={styles.qualityIndicator}>
                                            <Text style={styles.qualityText}>HD</Text>
                                        </View>
                                    )}
                                </View>
                                <View style={styles.textContainer}>
                                    <Text
                                        style={[styles.username, { color: '#333' }]}
                                        allowFontScaling={true}
                                    >
                                        {data?.name}
                                    </Text>

                                    <View style={styles.detailsRow}>
                                        <View style={styles.detailItem}>
                                            <Feather name="user" size={14} color="#888" />
                                            <Text style={styles.detailText}>
                                                {data?.gender}
                                            </Text>
                                        </View>

                                        <View style={styles.detailItem}>
                                            <Ionicons name="language-outline" size={14} color="#888" />
                                            <Text style={styles.detailText}>
                                                {data?.selectedLanguages?.join(', ')}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </LinearGradient>

                            <View style={styles.statsContainer}>
                                <StatItem
                                    icon={<MaterialCommunityIcons name="post-outline" size={22} color={'#000'} />}
                                    value={posts.length || 0}
                                    label="Posts"
                                />
                                <StatItem
                                    icon={<Feather name="users" size={22} color={'#000'} />}
                                    value={data?.followers?.length || 0}
                                    label="Followers"
                                    onPress={() => navigation.navigate('Follower')}
                                />
                                <StatItem
                                    icon={<SimpleLineIcons name="user-following" size={22} color={'#000'} />}
                                    value={data?.following?.length || 0}
                                    label="Followings"
                                    onPress={() => navigation.navigate('Following')}
                                />
                            </View>

                            <View style={styles.buttonDiv}>
                                <ActionButton title="Create Post" onPress={() => navigation.navigate('CreatePost')} />
                                <ActionButton title="Upload Video" onPress={() => navigation.navigate('CreateVideo')} />
                            </View>

                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>My Posts</Text>
                                <View style={styles.divider} />
                            </View>

                            <View style={styles.tabBar}>
                                {['All', 'Images', 'Videos'].map((t) => (
                                    <TouchableOpacity
                                        key={t}
                                        style={[styles.tabItem, tab === t && styles.activeTabItem]}
                                        onPress={() => setTab(t)}
                                        accessibilityLabel={`View ${t} posts`}
                                        accessibilityRole="button"
                                    >
                                        <Text style={[styles.tabLabel, tab === t && styles.activeTabLabel]}>
                                            {t}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </>
                    )}
                    renderItem={({ item }) => (
                        <View style={[styles.postCard]}>
                            <View style={styles.postHeader}>
                                <View style={styles.postUser}>
                                    <Image
                                        source={user?.profileUri && typeof user.profileUri === 'string' && user.profileUri.trim() !== '' ? { uri: user.profileUri } : require('../assets/images/avatar.png')}
                                        style={styles.postUserImage}
                                        accessibilityLabel="User profile picture"
                                    />
                                    <View style={styles.postUserInfo}>
                                        <Text
                                            style={[styles.postUserName]}
                                            allowFontScaling={true}
                                        >
                                            {user.name}
                                        </Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    ref={(el) => (dotsRef.current[item.id] = el)}
                                    onPress={() => handleDotsPress(item.id)}
                                >
                                    <Entypo name="dots-three-vertical" size={20} color={'#000'} />
                                </TouchableOpacity>
                                <DropdownMenu
                                    visible={dropdownVisible === item.id}
                                    onClose={() => setDropdownVisible(null)}
                                    onEdit={() => handleEditPost(item)}
                                    onDelete={() => handleDeletePost(item)}
                                    dropdownTop={dropdownPosition.top}
                                    dropdownLeft={dropdownPosition.left}
                                />
                            </View>
                            <Text style={[styles.postCaption]} allowFontScaling={true}>
                                {item.caption}
                            </Text>
                            {item.type === 'FEED' ? (
                                <Image
                                    source={item?.mediaUrl && typeof item.mediaUrl === 'string' && item.mediaUrl.trim() !== '' ? { uri: item.mediaUrl } : require('../assets/images/avatar.png')}
                                    style={styles.postMedia}
                                    resizeMode="cover"
                                    accessibilityLabel="Post image"
                                />
                            ) : (
                                <Video
                                    source={item?.mediaUrl && typeof item.mediaUrl === 'string' && item.mediaUrl.trim() !== '' ? { uri: item.mediaUrl } : require('../assets/images/avatar.png')}
                                    style={styles.videoPlayer}
                                    useNativeControls
                                    resizeMode="cover"
                                    isLooping
                                    accessibilityLabel="Post video"
                                />
                            )}
                            <View style={styles.postFooter}>
                                <View style={styles.postAction}>
                                    <Ionicons name="heart-outline" size={20} />
                                    <Text
                                        style={[styles.postActionText]}
                                        allowFontScaling={true}
                                    >
                                        {item.likes.length} Likes
                                    </Text>
                                </View>
                                <View style={styles.postAction}>
                                    <Ionicons name="chatbubble-outline" size={20} />
                                    <Text
                                        style={[styles.postActionText]}
                                        allowFontScaling={true}
                                    >
                                        {item.comments.length} Comments
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}
                />
                <RBSheet
                    ref={deleteRBSheetRef}
                    height={150}
                    openDuration={250}
                    customStyles={{
                        container: {
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderTopLeftRadius: 20,
                            borderTopRightRadius: 20,
                        },
                    }}
                >
                    <View style={styles.rbSheetContainer}>
                        <Text style={styles.rbSheetText}>Do you want to delete this post?</Text>
                        <View className="flex-row justify-between">
                            <TouchableOpacity className="flex-1 bg-gray-200 py-3 rounded-full mr-2" onPress={() => deleteRBSheetRef.current.close()}>
                                <Text className="text-center text-gray-800 font-medium">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity className="flex-1 bg-red-600 py-3 rounded-full" onPress={confirmDelete}>
                                <Text className="text-center text-white font-medium">Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </RBSheet>
                </>
            )}
        </>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        position: 'absolute',
        top: 45,
        right: 15,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 24,
        paddingBottom: 32,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    profileImageContainer: {
        position: 'relative',
    },
    profileImageRing: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#6156E2',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    profileRing: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#6200EE',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileRingText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    textContainer: {
        flex: 1,
        marginLeft: 16,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    username: {
        fontSize: 22,
        fontWeight: '700',
        color: '#333',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(97, 86, 226, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#6156E2',
    },
    detailsRow: {
        marginTop: 8,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    detailText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 8,
        textTransform: 'capitalize'
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        marginTop: -16,
        marginBottom: 24,
    },
    statCard: {
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        width: 100,
        shadowColor: '#6156E2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 14,
        color: '#888',
        marginTop: 4,
    },
    buttonDiv: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    button: {
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '48%',
        shadowColor: '#6156E2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    secondaryButton: {
        borderWidth: 1,
        borderColor: '#6156E2',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    secondaryButtonText: {
        color: '#6156E2',
    },
    sectionHeader: {
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
    },
    divider: {
        height: 3,
        width: 40,
        backgroundColor: '#6156E2',
        borderRadius: 2,
        marginTop: 8,
    },
    postsContainer: {
        paddingHorizontal: 24,
        marginTop: 8,
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#F5F5FF',
        borderRadius: 12,
        padding: 4,
        marginBottom: 16,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 10,
        borderRadius: 10,
    },
    activeTabItem: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#6156E2',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    tabLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#888',
    },
    activeTabLabel: {
        color: '#6156E2',
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 16,
        color: '#888',
    },
    postCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    postHeader: {
        marginBottom: 12,
        flexDirection: 'row', // Arrange children horizontally
        justifyContent: 'space-between', // Push items to the far ends
        alignItems: 'center',
    },
    postUser: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    postUserImage: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    postUserInfo: {
        marginLeft: 12,
    },
    postUserName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    postCaption: {
        fontSize: 14,
        color: '#555',
        marginBottom: 12,
        lineHeight: 20,
    },
    postMedia: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 12,
        marginBottom: 12,
    },
    videoPlayer: {
        width: '100%',
        aspectRatio: 16/9,
        borderRadius: 12,
        marginBottom: 12,
    },
    postFooter: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    postAction: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    postActionText: {
        fontSize: 14,
        color: '#888',
        marginLeft: 6,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    dropdown: {
        backgroundColor: '#fff',
        borderRadius: 5,
        padding: 10,
        position: 'absolute',
        width: 120, // You might want to adjust this or make it dynamic
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    dropdownItem: {
        paddingVertical: 10,
    },
    dropdownItemText: {
        fontSize: 16,
        color: '#333',
    },
    rbSheetContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    rbSheetText: {
        fontSize: 18,
        marginBottom: 20,
        textAlign: 'center',
    },
    qualityIndicator: {
        position: 'absolute',
        top: 0,
        left: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderRadius: 10,
        paddingVertical: 4,
        paddingHorizontal: 8,
        zIndex: 1,
    },
    qualityText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});

export default StreamerProfile;