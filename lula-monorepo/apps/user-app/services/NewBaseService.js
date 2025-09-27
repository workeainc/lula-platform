import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

// 🔗 Express.js Backend API Configuration
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3002/api'

class BaseService {
  constructor(collectionName) {
    this.collection = collectionName
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('authToken')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid, clear storage
          await AsyncStorage.removeItem('authToken')
          await AsyncStorage.removeItem('loggedInUserId')
        }
        return Promise.reject(error)
      }
    )
  }

  handleError(message) {
    console.error(message)
    return { error: true, message }
  }

  // 📝 Create document
  async create(data) {
    try {
      console.log(`📝 Creating ${this.collection}:`, data)
      
      const response = await this.api.post(`/${this.collection}`, data)

      if (response.data.error) {
        return { error: true, message: response.data.message }
      }

      return { error: false, data: response.data.data || response.data }

    } catch (error) {
      console.error(`❌ Create ${this.collection} error:`, error.message)
      return this.handleError(`Failed to create ${this.collection}`)
    }
  }

  // 📖 Get document by ID
  async getById(id) {
    try {
      console.log(`📖 Getting ${this.collection} by ID:`, id)
      
      const response = await this.api.get(`/${this.collection}/${id}`)

      if (response.data.error) {
        return { error: true, message: response.data.message }
      }

      return { error: false, data: response.data.data || response.data }

    } catch (error) {
      console.error(`❌ Get ${this.collection} error:`, error.message)
      return this.handleError(`Failed to get ${this.collection}`)
    }
  }

  // 📋 Get all documents
  async getAll(filters = {}) {
    try {
      console.log(`📋 Getting all ${this.collection}:`, filters)
      
      const response = await this.api.get(`/${this.collection}`, { params: filters })

      if (response.data.error) {
        return { error: true, message: response.data.message }
      }

      return { error: false, data: response.data.data || response.data }

    } catch (error) {
      console.error(`❌ Get all ${this.collection} error:`, error.message)
      return this.handleError(`Failed to get ${this.collection} list`)
    }
  }

  // ✏️ Update document
  async update(id, data) {
    try {
      console.log(`✏️ Updating ${this.collection}:`, id, data)
      
      const response = await this.api.put(`/${this.collection}/${id}`, data)

      if (response.data.error) {
        return { error: true, message: response.data.message }
      }

      return { error: false, data: response.data.data || response.data }

    } catch (error) {
      console.error(`❌ Update ${this.collection} error:`, error.message)
      return this.handleError(`Failed to update ${this.collection}`)
    }
  }

  // 🗑️ Delete document
  async delete(id) {
    try {
      console.log(`🗑️ Deleting ${this.collection}:`, id)
      
      const response = await this.api.delete(`/${this.collection}/${id}`)

      if (response.data.error) {
        return { error: true, message: response.data.message }
      }

      return { error: false, message: response.data.message || 'Deleted successfully' }

    } catch (error) {
      console.error(`❌ Delete ${this.collection} error:`, error.message)
      return this.handleError(`Failed to delete ${this.collection}`)
    }
  }

  // 🔍 Search documents
  async search(query, filters = {}) {
    try {
      console.log(`🔍 Searching ${this.collection}:`, query, filters)
      
      const response = await this.api.get(`/${this.collection}/search`, { 
        params: { q: query, ...filters } 
      })

      if (response.data.error) {
        return { error: true, message: response.data.message }
      }

      return { error: false, data: response.data.data || response.data }

    } catch (error) {
      console.error(`❌ Search ${this.collection} error:`, error.message)
      return this.handleError(`Failed to search ${this.collection}`)
    }
  }

  // 📊 Get documents as map
  async getAsMap() {
    try {
      const result = await this.getAll()
      if (result.error) {
        return result
      }

      const map = new Map()
      if (Array.isArray(result.data)) {
        result.data.forEach((item) => {
          map.set(item.id || item._id, item)
        })
      }

      return { error: false, data: map }

    } catch (error) {
      console.error(`❌ Get ${this.collection} as map error:`, error.message)
      return this.handleError(`Failed to get ${this.collection} as map`)
    }
  }

  // 📁 Upload file
  async uploadFile(file, path = '') {
    try {
      console.log(`📁 Uploading file to ${this.collection}:`, file.name)
      
      const formData = new FormData()
      formData.append('file', file)
      if (path) {
        formData.append('path', path)
      }

      const response = await this.api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (response.data.error) {
        return { error: true, message: response.data.message }
      }

      return { error: false, url: response.data.url, fileId: response.data.fileId }

    } catch (error) {
      console.error(`❌ Upload file error:`, error.message)
      return this.handleError('Failed to upload file')
    }
  }

  // 🔧 Custom API call
  async customCall(method, endpoint, data = null) {
    try {
      console.log(`🔧 Custom API call: ${method} ${endpoint}`, data)
      
      const config = {
        method,
        url: endpoint,
        ...(data && { data })
      }

      const response = await this.api(config)

      if (response.data.error) {
        return { error: true, message: response.data.message }
      }

      return { error: false, data: response.data }

    } catch (error) {
      console.error(`❌ Custom API call error:`, error.message)
      return this.handleError('Custom API call failed')
    }
  }
}

export default BaseService
