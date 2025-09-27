import { View, Text, TextInput, FlatList, Image, TouchableOpacity } from 'react-native'
import { useEffect, useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import Loading from '../components/shared/Loading'
import { handleError } from '../utils/function'
import BackendService from '../services/BackendService'
import { useSelector } from 'react-redux'
import { useNavigation } from '@react-navigation/native'

export default function Followers() {
    const navigation = useNavigation()
    const { user } = useSelector((state) => state.auth)
    const [search, setSearch] = useState('')
    const [following, setFollowing] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const getFollowers = async () => {
            try {
                setIsLoading(true) // Set loading to true at the start
                const res = await FollowService.getFollowers(user.id)
                if (!res.error) {
                    setFollowing(res.followers)
                }
            } catch (error) {
                handleError(error)
            } finally {
                setIsLoading(false)
            }
        }
        getFollowers()
    }, [])

    // Placeholder image URI (you can replace this with your own image URL or local asset)
    const placeholderImage = 'https://via.placeholder.com/150'; // Example placeholder URL

    return (
        <>
            <Loading isVisible={isLoading} />
            {!isLoading && (
                <View className="flex-1 bg-white my-4">
                    {/* Header */}
                    <View className="flex-row items-center p-4">
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <Ionicons name="arrow-back-sharp" size={24} color="black" />
                        </TouchableOpacity>
                        <Text className="text-xl font-bold mx-auto">Followers</Text>
                    </View>

                    {/* Search Bar */}
                    <View className="px-4">
                        <TextInput
                            className="w-full p-3 bg-gray-200 rounded-lg"
                            placeholder="Search Followers..."
                            value={search}
                            onChangeText={setSearch}
                        />
                    </View>

                    {/* Followers List */}
                    <FlatList
                        data={following.filter((f) => f?.name?.toLowerCase().includes(search?.toLowerCase()))}
                        keyExtractor={(item) => item.id}
                        ListEmptyComponent={() => (
                            <View className="items-center justify-center mt-20">
                                <Text className="text-gray-500 text-lg">No follower users found.</Text>
                            </View>
                        )}
                        renderItem={({ item }) => (
                            <View className="flex-row items-center p-4 border-b border-gray-200">
                                <Image
                                    source={item?.profileUri && typeof item.profileUri === 'string' && item.profileUri.trim() !== '' ? { uri: item.profileUri } : require('../assets/images/avatar.png')}
                                    className="w-12 h-12 rounded-full"
                                />
                                <View className="ml-3">
                                    <Text className="text-base font-semibold">{item.name}</Text>
                                </View>
                            </View>
                        )}
                    />
                </View>
            )}
        </>
    )
}