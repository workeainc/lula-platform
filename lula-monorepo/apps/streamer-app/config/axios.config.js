import { createAxiosInstance, getAuthToken, clearAuthToken } from '@lula/shared-config'
import store from '../store/store'
import { clearAuth } from '../store/slices/auth'

const unauthorizedCode = [401]

// Use shared axios configuration
export const axiosInstance = createAxiosInstance({
    API_BASE_URL: 'http://13.53.137.157:5002/api',
    ENVIRONMENT: 'production'
})

axiosInstance.interceptors.request.use(
    (config) => {
        

        // For form data requests, ensure proper handling
        if (config.data instanceof FormData) {
            config.headers['Content-Type'] = 'multipart/form-data';
            // Prevent data transformation
            config.transformRequest = [(data) => data];
        }


        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        const { response } = error

        if (response && unauthorizedCode.includes(response.status)) {
            store.dispatch(clearAuth())
            clearAuthToken()
            location.replace('/')
        }

        return Promise.reject(error)
    }
)

export default axiosInstance
