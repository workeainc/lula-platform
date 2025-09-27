import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { NavigationContainer } from '@react-navigation/native'
import React, { useState, useEffect, useCallback } from 'react'
import { AppState } from 'react-native'
import NetInfo from '@react-native-community/netinfo'
import BottomTabNavigation from './BottomTabNavigation'
import { useDispatch, useSelector } from 'react-redux'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SplashScreen from 'expo-splash-screen'
import { useFonts } from 'expo-font'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { FONTS } from '../constants/fonts'
// ✅ Express.js Backend Integration - Firebase removed
import { navigationRef } from './RootNavigation'
import {
    NoInternet,
    Select,
    Login,
    Otp,
    Matching,
    SelectPartner,
    StartCalling,
    ExploreMatch,
    Notification,
    Chat,
    Setting,
    About,
    PrivacyPolicy,
    TransactionHistory,
    Plans,
    Explore,
    EditProfile,
    OnBoarding1,
    CreateProfile,
    Menu,
    CreatePost,
    Following,
    Follower,
    Call,
    ReceiveCall,
    Withdraw,
    PendingVerification,
    CreateVideo,
    CallLogScreen,
    EditPost,
} from '../screens'
import { handleError } from '../utils/function'
// ✅ Express.js Backend Integration - Firebase removed
import NewAuthService from '../services/NewAuthService'
import showToast from '../utils/toast'
import { setUser } from '../store/slices/auth'
import { Camera } from 'expo-camera'
import { Audio } from 'expo-av'
import CallManager from '../utils/CallManager'
import CallWrapper from '../components/wrapper/CallWrapper'
SplashScreen.preventAutoHideAsync()
const Stack = createNativeStackNavigator()

const AppNavigation = () => {
    const { user } = useSelector((state) => state.auth)
    const dispatch = useDispatch()
    const [isConnected, setIsConnected] = useState(true)
    const [isFirstLaunch, setIsFirstLaunch] = useState(null)
    const [fontsLoaded] = useFonts(FONTS)
    
    // 🌐 Web compatibility: Skip font loading requirement on web
    const isWeb = typeof window !== 'undefined'
    const shouldWaitForFonts = !isWeb && !fontsLoaded
    const [isLoading, setIsLoading] = useState(true)

    // ✅ Express.js Backend Integration - Firebase removed
    let currentUser = null
    // Firebase authentication removed - using Express.js backend

    const onLayoutRootView = useCallback(async () => {
        if (fontsLoaded || isWeb) {
            await SplashScreen.hideAsync()
        }
    }, [fontsLoaded, isWeb])

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((state) => {
            setIsConnected(!!state.isConnected)
        })
        return () => {
            unsubscribe()
        }
    }, [])

    // App state logging - same as lula-user
    useEffect(() => {
        const handleAppStateChange = (nextAppState) => {
            if (nextAppState === 'background' || nextAppState === 'inactive') {
                console.log('🔄 App going to background, cleaning up resources...')
                // Force garbage collection if possible
                if (global.gc) {
                    global.gc()
                }
            } else if (nextAppState === 'active') {
                console.log('🔄 App coming to foreground')
            }
        }
        
        const subscription = AppState.addEventListener('change', handleAppStateChange)
        
        return () => {
            subscription?.remove()
        }
    }, [])

  
    if (user) {
        new CallManager(user)
    }
useEffect(() => {
  const restoreUserFromStorage = async () => {
    console.log('🔍 [AppNavigation] Starting user restoration process...')
    try {
      const storedUserId = await AsyncStorage.getItem('loggedInUserId')
      if (storedUserId) {
        console.log('🔍 [AppNavigation] Found stored user ID:', storedUserId)
        // Use the new session checking method with timeout
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Backend timeout')), 2000) // Reduced to 2 seconds
        );
        
        try {
          console.log('🔍 [AppNavigation] Checking user session...')
          const res = await Promise.race([
            NewAuthService.getCurrentUser(),
            timeoutPromise
          ]);
          
          if (!res.error && res.user && res.user.id) {
            dispatch(setUser(res.user))
            console.log('✅ [AppNavigation] User restored from storage:', res.user.id)
          } else {
            console.warn('⚠️ [AppNavigation] User session invalid:', res.message)
            // Clear storage if session invalid
            await AsyncStorage.removeItem('loggedInUserId')
          }
        } catch (backendError) {
          console.warn('⏰ [AppNavigation] Backend unavailable, proceeding without user session:', backendError.message)
          // Don't clear storage on timeout - user might be offline
          // await AsyncStorage.removeItem('loggedInUserId')
        }
      } else {
        console.log('🔍 [AppNavigation] No stored user ID found')
      }
    } catch (error) {
      console.error('❌ [AppNavigation] Failed to restore user from AsyncStorage:', error)
      // Clear storage on error to prevent issues
      try {
        await AsyncStorage.removeItem('loggedInUserId')
      } catch (clearError) {
        console.error('Failed to clear storage:', clearError)
      }
    } finally {
      console.log('✅ [AppNavigation] User restoration complete, setting loading to false')
      setIsLoading(false)
    }
  }

  restoreUserFromStorage()
}, [])

    useEffect(() => {
        ;(async () => {
            try {
                const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync()
                // For expo-av@13 on SDK 50, use requestPermissionsAsync
                const { status: audioStatus } = await Audio.requestPermissionsAsync()
            } catch (e) {
                console.warn('Permission request failed', e)
            }
        })()
    }, [])

    // Check if it's the first launch
    useEffect(() => {
        const checkFirstLaunch = async () => {
            try {
                const firstLaunch = await AsyncStorage.getItem('isFirstLaunch')
                if (firstLaunch === null) {
                    // First time launch
                    setIsFirstLaunch(true)
                    await AsyncStorage.setItem('isFirstLaunch', 'false') // Set it to false after the first launch
                } else {
                    // Not the first time
                    setIsFirstLaunch(false)
                }
            } catch (error) {
                console.error('Error checking first launch: ', error)
                // Default to not first launch on error
                setIsFirstLaunch(false)
            }
        }

        checkFirstLaunch()
    }, [])

    const getinitialScreen = useCallback(() => {
        if (!isConnected) {
            return 'NoInternet'
        }
        let initial = isFirstLaunch ? 'OnBoarding1' : 'Login'

        if (user && user.profileCompleted) {
            // Check streamer status after profile completion
            if (user.role === "STREAMER" && user.status === false) {
                initial = 'PendingVerification';
            } else {
                initial = 'Main';
            }
        }
        if (user && !user.profileCompleted) {
            initial = 'CreateProfile'
        }

        return initial
    }, [isFirstLaunch, isConnected, user])

    // Debug logging for loading states
    console.log('🔍 AppNavigation Loading States:', {
        isFirstLaunch,
        fontsLoaded,
        shouldWaitForFonts,
        isLoading,
        user: user?.id || 'none',
        isWeb
    });

    if (isFirstLaunch === null || shouldWaitForFonts || isLoading) {
        console.log('🔍 AppNavigation waiting because:', {
            waitingForFirstLaunch: isFirstLaunch === null,
            waitingForFonts: shouldWaitForFonts,
            waitingForLoading: isLoading
        });
        return null // Wait until the first launch status is determined and fonts are loaded
    }

    return (
        <SafeAreaProvider onLayout={onLayoutRootView}>
            <CallWrapper>
                <NavigationContainer ref={navigationRef}>
                    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={getinitialScreen()}>
                        <Stack.Screen name="NoInternet" component={NoInternet} />
                        <Stack.Screen name="OnBoarding1" component={OnBoarding1} />
                        <Stack.Screen name="Menu" component={Menu} />
                        <Stack.Screen name="Select" component={Select} />
                        <Stack.Screen name="Login" component={Login} />
                        <Stack.Screen name="Otp" component={Otp} />
                        <Stack.Screen name="TransactionHistory" component={TransactionHistory} />
                        <Stack.Screen name="CreateProfile" component={CreateProfile} />
                        <Stack.Screen name="Matching" component={Matching} />
                        <Stack.Screen name="SelectPartner" component={SelectPartner} />
                        <Stack.Screen name="Explore" component={Explore} />
                        <Stack.Screen name="ExploreMatch" component={ExploreMatch} />
                        <Stack.Screen name="Notification" component={Notification} />
                        <Stack.Screen name="Setting" component={Setting} />
                        <Stack.Screen name="About" component={About} />
                        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
                        <Stack.Screen name="Plans" component={Plans} />
                        <Stack.Screen name="Chat" component={Chat} />
                        <Stack.Screen name="StartCalling" component={StartCalling} />
                        <Stack.Screen name="CreatePost" component={CreatePost} />
                        <Stack.Screen name="EditProfile" component={EditProfile} />
                        <Stack.Screen name="Following" component={Following} />
                        <Stack.Screen name="Follower" component={Follower} />
                        <Stack.Screen name="Main" component={BottomTabNavigation} />
                        <Stack.Screen name="Call" component={Call} />
                        <Stack.Screen name="ReceiveCall" component={ReceiveCall} />
                        <Stack.Screen name="Withdraw" component={Withdraw} />
                        <Stack.Screen name="PendingVerification" component={PendingVerification} />
                        <Stack.Screen name="CreateVideo" component={CreateVideo} />
                        <Stack.Screen name="CallLogScreen" component={CallLogScreen} />
                        <Stack.Screen name="EditPost" component={EditPost} />
                    </Stack.Navigator>
                </NavigationContainer>
            </CallWrapper>
        </SafeAreaProvider>
    )
}

export default AppNavigation
