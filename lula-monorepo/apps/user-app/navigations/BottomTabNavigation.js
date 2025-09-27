import { View, Text, Platform, StyleSheet, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import StreamerProfile from '../screens/StreamerProfile';
import Users from '../screens/Users';
import LiveStreaming from '../screens/LiveStreaming';
import ChatList from '../screens/ChatList';
import Analytics from '../screens/Analytics';
import showToast from '../utils/toast';
import { useTheme } from '../theme/ThemeProvider';
import NewAuthService from '../services/NewAuthService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { updateUser } from '../store/slices/auth';

const Tab = createBottomTabNavigator();

const TabBarIconWithReanimated = ({ focused, iconName, label }) => {
  return (
    <View style={styles.tabIconContainer}>
      <Ionicons
        name={iconName}
        size={22}
        color={focused ? '#fff' : '#E5E5E5'}
      />
      {label && (
        <Text style={[styles.tabLabel, { color: focused ? '#fff' : '#E5E5E5' }]}>
          {label}
        </Text>
      )}
    </View>
  );
};

const BottomTabNavigation = () => {
  const { dark } = useTheme();
  const { user } = useSelector((state) => state.auth);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const dispatch = useDispatch();
  const isUserOnline = user?.statusShow === true;
  const [isOnlineOfflineModalVisible, setIsOnlineOfflineModalVisible] = useState(false);

  const fetchUserData = async () => {
    
  };

  // useEffect(() => {
  //   try {
  //     setIsLoading(true);
  //     console.log(user)
      
  //     if (!res.error) {
        
  //     } else {
  //       showToast(res.message, 'error');
  //     }
  //   } catch (error) {
  //     console.error('User data error:', error);
  //     showToast('Failed to load user data', 'error');
  //   } 
  // }, [user?.id, dispatch]);

  const handleOnlineOfflineChoice = async (choice) => {
    if (!user?.id) {
      showToast('User not recognized', 'error');
      return;
    }

    setIsOnlineOfflineModalVisible(false);
    
    try {
      setIsUpdatingStatus(true);
      const response = await AuthService.updateStatusShow(user.id, choice);
      const res = await AuthService.getUser(user.id);
      setData(res.user);
      dispatch(updateUser(res.user));

      showToast(
        response.error ? response.message : 'Status updated successfully',
        response.error ? 'error' : 'success'
      );
    } catch (error) {
      console.error('Status update error:', error);
      showToast('Failed to update status', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          tabBarShowLabel: false,
          headerShown: false,
          tabBarStyle: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: 5,
            height: Platform.OS === 'ios' ? 65 : 55,
          },
          tabBarBackground: () => (
            <LinearGradient
              colors={['rgba(171, 73, 161, 1)', 'rgba(97, 86, 226, 1)']}
              style={styles.gradientStyle}
            />
          ),
        }}
      >
        <Tab.Screen
          name="Users"
          component={Users}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabBarIconWithReanimated
                focused={focused}
                iconName={focused ? 'people' : 'people-outline'}
                label="Users"
              />
            ),
          }}
        />
        <Tab.Screen
          name="Analytics"
          component={Analytics}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabBarIconWithReanimated
                focused={focused}
                iconName={focused ? 'analytics' : 'analytics-outline'}
                label="Analytics"
              />
            ),
          }}
        />
        <Tab.Screen
          name="LiveStreaming"
          component={LiveStreaming}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              e.preventDefault();
              setIsOnlineOfflineModalVisible(true);
            },
          })}
          options={{
            tabBarIcon: ({ focused }) => (
              <LinearGradient
                colors={['#fff', '#fff']}
                style={styles.locationButton}
              >
                <Ionicons
                  name="add"
                  size={28}
                  color="rgba(171, 73, 161, 1)"
                />
              </LinearGradient>
            ),
            tabBarStyle: {
              display: "none"
            }
          }}
        />
        <Tab.Screen
          name="Chats"
          component={ChatList}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabBarIconWithReanimated
                focused={focused}
                iconName={focused ? 'chatbubble' : 'chatbubble-outline'}
                label="Chats"
              />
            ),
          }}
        />
        <Tab.Screen
          name="StreamerProfile"
          component={StreamerProfile}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabBarIconWithReanimated
                focused={focused}
                iconName={focused ? 'speedometer' : 'speedometer-outline'}
                label="Profile"
              />
            ),
          }}
        />
      </Tab.Navigator>

      {/* Status Selection Modal */}
      <Modal
        transparent={true}
        visible={isOnlineOfflineModalVisible}
        animationType="fade"
        onRequestClose={() => setIsOnlineOfflineModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose Your Status</Text>
            
            <TouchableOpacity
              style={[styles.choiceButton, isUpdatingStatus && styles.disabledButton]}
              onPress={() => handleOnlineOfflineChoice(!isUserOnline)}
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.choiceButtonText}>
                  {isUserOnline ? 'Go Offline' : 'Go Online'}
                </Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setIsOnlineOfflineModalVisible(false)}
              disabled={isUpdatingStatus}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    paddingVertical: 8,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  locationButton: {
    width: 45,
    height: 45,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 200,
  },
  gradientStyle: {
    flex: 1,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  choiceButton: {
    backgroundColor: '#CE54C1',
    padding: 15,
    borderRadius: 5,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  choiceButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.6,
  },
  cancelButton: {
    marginTop: 15,
    padding: 10,
    width: '100%',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#CE54C1',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default BottomTabNavigation;