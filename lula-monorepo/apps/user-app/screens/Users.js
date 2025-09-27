import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import NewUserService from '../services/NewUserService';
import NewAuthService from '../services/NewAuthService';
import UserCard from '../components/card/UserCard';
import { useSelector } from 'react-redux';

// Shuffle function to randomize array
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const Users = () => {
  const navigation = useNavigation();
  const { user } = useSelector((state) => state.auth);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Fetch all online users in one go (fallback to active users if none)
  const fetchUsers = async () => {
    if (loading) return;
    setLoading(true);
    try {
      console.log('Fetching all online users...');
      let result = await UserService.getAllOnlineUsers();
      if (!result || !Array.isArray(result.users) || result.users.length === 0) {
        console.log('No online users found, fetching all active users...');
        result = await UserService.getAllActiveUsers(200, null);
      }
      if (!result || !Array.isArray(result.users)) {
        console.warn('Invalid users data received:', result);
        setUsers([]);
        return;
      }
      const newUsers = shuffleArray(result.users || []);
      setUsers(newUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  // Initial fetch
  useEffect(() => {
    const testAndFetch = async () => {
      try {
        // Test the user service first
        console.log('Testing user service...');
        const testResult = await UserService.testUserFetch();
        console.log('Test result:', testResult);
        
        // Then fetch users normally
        await fetchUsers(true);
      } catch (error) {
        console.error('Error in test and fetch:', error);
      }
    };
    
    testAndFetch();
  }, []);

  // Fetch logged-in user's profile
  useEffect(() => {
    const getData = async () => {
      try {
        if (!user?.id) {
          console.warn('No user ID available for profile fetch');
          return;
        }
        setProfileLoading(true);
        const res = await AuthService.getUser(user.id);
        if (!res.error && res.user) {
          setProfileData(res.user);
        } else {
          console.warn('Failed to fetch profile data:', res);
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setProfileLoading(false);
      }
    };
    getData();
  }, [user?.id]);

  return (
    <LinearGradient
      colors={['rgba(171, 73, 161, 0.9)', 'rgba(97, 86, 226, 0.9)']}
      style={styles.gradient}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Users</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.headerIconsTab}
            onPress={() => navigation.navigate('Analytics')}
          >
            <MaterialIcons name="analytics" size={29} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('StreamerProfile')}>
            <Image
              source={
                profileData?.profileUri && typeof profileData.profileUri === 'string' && profileData.profileUri.trim() !== ''
                  ? { uri: profileData.profileUri }
                  : require('../assets/images/avatar.png')
              }
              style={styles.headerIconsImage}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {loading && users.length === 0 ? (
          <View style={styles.fullScreenLoader}>
            <ActivityIndicator size="large" color="#9747FF" />
            <Text style={{ marginTop: 10, color: '#666' }}>Loading users...</Text>
          </View>
        ) : (
          <FlatList
            data={users.filter(item => item && item.id && item.statusShow === true)}
            keyExtractor={(item) => item?.id || Math.random().toString()}
            renderItem={({ item }) => <UserCard item={item} />}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            contentContainerStyle={{ paddingBottom: 80 }}
          />
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  header: {
    width: '100%',
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
  },
  headerIcons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  headerIconsImage: {
    width: 32,
    height: 32,
    marginLeft: 10,
    borderRadius: 250,
    objectFit: 'cover',
  },
  content: {
    width: '100%',
    marginBottom: 30,
    backgroundColor: '#fff',
    borderTopLeftRadius: 15,
    height: '100%',
    borderTopRightRadius: 15,
  },
  fullScreenLoader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
});

export default Users;
