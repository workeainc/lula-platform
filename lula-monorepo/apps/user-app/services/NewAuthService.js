import AsyncStorage from '@react-native-async-storage/async-storage'

// 🔗 Express.js Backend API Configuration
// For web builds, use localhost URL that browser can access
// For mobile builds, use the environment variable or fallback
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3002/api'

class AuthService {
  constructor() {
    console.log('🔍 AuthService API_BASE_URL:', API_BASE_URL);
    console.log('🔍 Environment EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL);
    
    // Ensure the URL is properly formatted
    this.baseURL = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
    console.log('🔍 Clean base URL:', this.baseURL);
  }

  // 🔧 Helper method to make API calls with fetch
  async makeRequest(endpoint, options = {}) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      console.log('🌐 Making request to:', url);

      // Get auth token if needed
      const token = await AsyncStorage.getItem('authToken');
      
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      };

      if (token && !options.skipAuth) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        ...options,
        headers
      });

      console.log('🌐 Response status:', response.status, 'for', url);

      // Handle 401 errors by clearing auth data
      if (response.status === 401) {
        console.log('🔑 Token expired, clearing auth data');
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('loggedInUserId');
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };

    } catch (error) {
      console.error('❌ Request failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  handleError(message) {
    console.error(message)
    return { error: true, message }
  }

  // 📲 Register/Login with phone number
  async register(phoneNumber, role = 'USER') {
    try {
      console.log('📱 Registering user with phone:', phoneNumber)
      
      const fullUrl = `${API_BASE_URL}/auth/register`
      console.log('🔍 Making request to URL:', fullUrl)
      
      const requestBody = {
        phoneNumber,
        role
      }

      console.log('🔍 Request body:', requestBody)

      // Use fetch instead of Axios to avoid URL parsing issues
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      console.log('🔍 Response status:', response.status)
      console.log('🔍 Response ok:', response.ok)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const responseData = await response.json()
      console.log('🔍 Registration response:', responseData)

      if (responseData.error) {
        return { error: true, message: responseData.message }
      }

      const { user, token } = responseData
      
      if (!user || !token) {
        console.error('❌ Missing user or token in response:', { user, token })
        return { error: true, message: 'Invalid response from server' }
      }
      
      // Save auth token and user ID
      await AsyncStorage.setItem('authToken', token)
      await AsyncStorage.setItem('loggedInUserId', user.id)

      console.log('✅ User registered successfully:', user.id)
      return { error: false, user }

    } catch (error) {
      console.error('❌ Registration error:', error)
      console.error('❌ Registration error message:', error.message)
      console.error('❌ Registration error stack:', error.stack)
      return this.handleError('Failed to register user')
    }
  }

  // 🔐 Verify OTP
  async verifyOtp(phoneNumber, otpCode) {
    try {
      console.log('🔐 Verifying OTP for:', phoneNumber)
      
      const result = await this.makeRequest('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({
          phoneNumber,
          otp: otpCode
        }),
        skipAuth: true
      });

      if (!result.success) {
        return { error: true, message: result.error }
      }

      if (result.data.error) {
        return { error: true, message: result.data.message }
      }

      console.log('✅ OTP verified successfully')
      return { error: false, message: result.data.message }

    } catch (error) {
      console.error('❌ OTP verification error:', error.message)
      return this.handleError('Failed to verify OTP')
    }
  }

  // 👤 Get user profile
  async getUserProfile(userId) {
    try {
      console.log('👤 Getting user profile:', userId)
      
      const result = await this.makeRequest(`/auth/profile?userId=${userId}`);

      if (!result.success) {
        return { error: true, message: result.error }
      }

      if (result.data.error) {
        return { error: true, message: result.data.message }
      }

      return { error: false, user: result.data.user }

    } catch (error) {
      console.error('❌ Get profile error:', error.message)
      return this.handleError('Failed to get user profile')
    }
  }

  // ✏️ Update user profile
  async updateUserProfile(userId, updateData) {
    try {
      console.log('✏️ Updating user profile:', userId, updateData)
      
      const result = await this.makeRequest('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          userId,
          ...updateData
        })
      });

      if (!result.success) {
        return { error: true, message: result.error }
      }

      if (result.data.error) {
        return { error: true, message: result.data.message }
      }

      return { error: false, user: result.data.user }

    } catch (error) {
      console.error('❌ Update profile error:', error.message)
      return this.handleError('Failed to update user profile')
    }
  }

  // 🔄 Update user status (online/offline)
  async updateStatusShow(userId, status) {
    try {
      console.log('🔄 Updating user status:', userId, status)
      
      const result = await this.makeRequest('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          userId,
          statusShow: status,
          isOnline: status
        })
      });

      if (!result.success) {
        return { error: true, message: result.error }
      }

      if (result.data.error) {
        return { error: true, message: result.data.message }
      }

      return { error: false, message: `User status updated to ${status ? 'online' : 'offline'}` }

    } catch (error) {
      console.error('❌ Update status error:', error.message)
      return this.handleError('Failed to update user status')
    }
  }

  // 🚪 Logout
  async logout(userId) {
    try {
      console.log('🚪 Logging out user:', userId)
      
      const result = await this.makeRequest('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ userId })
      });

      // Clear local storage regardless of API response
      await AsyncStorage.removeItem('authToken')
      await AsyncStorage.removeItem('loggedInUserId')

      return { error: false, message: 'Logged out successfully' }

    } catch (error) {
      console.error('❌ Logout error:', error.message)
      // Still clear storage even if API call fails
      await AsyncStorage.removeItem('authToken')
      await AsyncStorage.removeItem('loggedInUserId')
      return this.handleError('Failed to logout properly')
    }
  }

  // 🔍 Check user session validity
  async checkUserSession(userId) {
    try {
      console.log('🔍 Checking user session:', userId)
      
      const result = await this.makeRequest(`/auth/profile?userId=${userId}`);

      if (!result.success) {
        // Clear session on error
        await AsyncStorage.removeItem('authToken')
        await AsyncStorage.removeItem('loggedInUserId')
        return { error: true, message: result.error, user: null }
      }

      if (result.data.error) {
        // User not found or invalid, clear session
        await AsyncStorage.removeItem('authToken')
        await AsyncStorage.removeItem('loggedInUserId')
        return { error: true, message: result.data.message, user: null }
      }

      return { error: false, user: result.data.user }

    } catch (error) {
      console.error('❌ Check session error:', error.message)
      // Clear session on error
      await AsyncStorage.removeItem('authToken')
      await AsyncStorage.removeItem('loggedInUserId')
      return this.handleError('Failed to check user session')
    }
  }

  // 🗑️ Delete account
  async deleteAccount(userId) {
    try {
      console.log('🗑️ Deleting account:', userId)
      
      // Note: You'll need to add a delete account endpoint to your Express.js backend
      const result = await this.makeRequest(`/auth/account/${userId}`, {
        method: 'DELETE'
      });

      // Clear local storage
      await AsyncStorage.removeItem('authToken')
      await AsyncStorage.removeItem('loggedInUserId')

      return { error: false, message: 'Account deleted successfully' }

    } catch (error) {
      console.error('❌ Delete account error:', error.message)
      return this.handleError('Failed to delete account')
    }
  }

  // 📡 Listen to user updates (using WebSocket)
  listenUserId(userId, callback) {
    console.log('📡 Setting up WebSocket listener for user:', userId)
    
    // This would integrate with your WebSocket service
    // For now, return a no-op unsubscribe function
    return () => {
      console.log('📡 WebSocket listener removed for user:', userId)
    }
  }

  // 👤 Get user data
  async getUser(userId) {
    try {
      console.log('👤 Getting user data for:', userId)
      const result = await this.makeRequest(`/auth/profile?userId=${userId}`);
      
      if (!result.success) {
        return { error: true, message: result.error }
      }

      return { error: false, user: result.data.user }
    } catch (error) {
      console.error('❌ Get user error:', error)
      return this.handleError('Failed to get user data')
    }
  }

  // 🔄 Update user data
  async update(userId, updateData) {
    try {
      console.log('🔄 Updating user data for:', userId, updateData)
      const result = await this.makeRequest(`/auth/profile`, {
        method: 'PUT',
        body: JSON.stringify({ userId, ...updateData })
      });

      if (!result.success) {
        return { error: true, message: result.error }
      }

      return { error: false, user: result.data.user }
    } catch (error) {
      console.error('❌ Update user error:', error)
      return this.handleError('Failed to update user data')
    }
  }

  // 🔧 Get auth token
  async getAuthToken() {
    try {
      return await AsyncStorage.getItem('authToken')
    } catch (error) {
      console.error('❌ Get auth token error:', error.message)
      return null
    }
  }

  // 🔧 Set auth token
  async setAuthToken(token) {
    try {
      await AsyncStorage.setItem('authToken', token)
      return true
    } catch (error) {
      console.error('❌ Set auth token error:', error.message)
      return false
    }
  }

  // 👤 Get current user from storage
  async getCurrentUser() {
    try {
      const userId = await AsyncStorage.getItem('loggedInUserId')
      if (!userId) {
        console.log('👤 No current user ID in storage')
        return { error: false, user: null }
      }
      
      console.log('👤 Getting current user:', userId)
      return await this.getUser(userId)
    } catch (error) {
      console.error('❌ Get current user error:', error.message)
      return { error: true, message: 'Failed to get current user', user: null }
    }
  }

  // 📁 Upload file method for profile images
  async uploadFiles(fileUri, path = '') {
    try {
      console.log('📁 Uploading file to path:', path, 'URI:', fileUri?.substring(0, 50) + '...')
      
      if (!fileUri) {
        return { error: true, message: 'No file provided' }
      }

      // Create FormData for file upload
      const formData = new FormData()
      
      // Handle different file formats (web vs native)
      if (typeof fileUri === 'string' && fileUri.startsWith('data:')) {
        // Web data URL - convert to blob
        const response = await fetch(fileUri)
        const blob = await response.blob()
        
        // Extract filename from blob type or use default
        const fileExtension = blob.type.split('/')[1] || 'png'
        const fileName = `profile_${Date.now()}.${fileExtension}`
        
        formData.append('image', blob, fileName)
      } else if (typeof fileUri === 'object' && fileUri.uri) {
        // Native file object with uri
        const response = await fetch(fileUri.uri)
        const blob = await response.blob()
        
        const fileName = fileUri.fileName || `profile_${Date.now()}.jpg`
        formData.append('image', blob, fileName)
      } else {
        // Direct URI string (native)
        const response = await fetch(fileUri)
        const blob = await response.blob()
        
        const fileName = `profile_${Date.now()}.jpg`
        formData.append('image', blob, fileName)
      }
      
      if (path) {
        formData.append('path', path)
      }

      const url = `${this.baseURL}/upload/image`
      console.log('📁 Uploading to:', url)

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type - let browser set it with boundary for multipart
          'Accept': 'application/json',
        }
      })

      const result = await response.json()
      console.log('📁 Upload response:', result)

      if (!response.ok || result.error) {
        return { error: true, message: result.message || 'Upload failed' }
      }

      return result.url || result.fileUrl || result.data?.url
    } catch (error) {
      console.error('❌ Upload file error:', error)
      return { error: true, message: 'Failed to upload file' }
    }
  }
}

export default new AuthService()