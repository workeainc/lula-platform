import { View, Text, TextInput, FlatList, Image, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import Loading from '../components/shared/Loading';
import { handleError } from '../utils/function';
import BackendService from '../services/BackendService';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';

export default function Following() {
    const navigation = useNavigation();
    const { user } = useSelector((state) => state.auth);
    const [search, setSearch] = useState('');
    const [following, setFollowing] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const getFollowing = async () => {
        try {
            setIsLoading(true); // Show loading while fetching
            const res = await FollowService.getFollowing(user.id);
            if (!res.error) {
                setFollowing(res.following);
            }
        } catch (error) {
            handleError(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Fetch following list when component mounts
        getFollowing();

        // Re-fetch when screen comes into focus
        const unsubscribe = navigation.addListener('focus', () => {
            getFollowing();
        });

        // Cleanup listener on unmount
        return unsubscribe;
    }, [navigation, user.id]);

    const handleRemove = async (followingId) => {
        try {
            setFollowing((prev) => prev.filter((item) => item.id !== followingId));
            await FollowService.unfollowUser(user.id, followingId);
        } catch (error) {
            handleError(error);
        }
    };

    return (
        <>
            <Loading isVisible={isLoading} />
            {!isLoading && (
                <View className="flex-1 bg-white my-4">
                    {/* Header */}
                    <View className="flex-row items-center p-4">
                        <TouchableOpacity onPress={() => {
                            if (navigation.canGoBack()) {
                                navigation.goBack()
                            } else {
                                navigation.reset({ index: 0, routes: [{ name: 'Main' }] })
                            }
                        }}>
                            <Ionicons name="arrow-back-sharp" size={24} color="black" />
                        </TouchableOpacity>
                        <Text className="text-xl font-bold mx-auto">Following</Text>
                    </View>

                    {/* Search Bar */}
                    <View className="px-4">
                        <TextInput
                            className="w-full p-3 bg-gray-200 rounded-lg"
                            placeholder="Search Following..."
                            value={search}
                            onChangeText={setSearch}
                        />
                    </View>

                    {/* Followers List */}
                    <FlatList
                        data={following.filter((f) =>
                            search ? f.name?.toLowerCase().includes(search.toLowerCase()) : true
                        )}
                        keyExtractor={(item) => item.id}
                        ListEmptyComponent={() => (
                            <View className="items-center justify-center mt-20">
                                <Text className="text-gray-500 text-lg">No following users found.</Text>
                            </View>
                        )}
                        renderItem={({ item }) => (
                            <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
                                <View className="flex-row items-center">
                                    <Image source={item?.profileUri && typeof item.profileUri === 'string' && item.profileUri.trim() !== '' ? { uri: item.profileUri } : require('../assets/images/avatar.png')} className="w-12 h-12 rounded-full" />
                                    <View className="ml-3">
                                        <Text className="text-base font-semibold">{item.name || 'Anonymous User'}</Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    className="bg-[#39E300] px-4 py-1 rounded-lg"
                                    onPress={() => handleRemove(item.id)}
                                >
                                    <Text>Remove</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    />
                </View>
            )}
        </>
    );
}