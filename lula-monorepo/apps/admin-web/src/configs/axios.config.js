import { createAxiosInstance, getAuthToken, clearAuthToken } from '@lula/shared-config';
import store from "../store";
import { clearAuth } from "../store/slice/auth";

const unauthorizedCode = [401];

// Use shared axios configuration
export const axiosInstance = createAxiosInstance({
  API_BASE_URL: `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3002'}/api`,
  ENVIRONMENT: 'development'
});

axiosInstance.interceptors.request.use(
  (config) => {
    let accessToken;

    if (!accessToken) {
      const { auth } = store.getState();
      accessToken = auth.token;
    }

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;

    if (response && unauthorizedCode.includes(response.status)) {
      store.dispatch(clearAuth());
      clearAuthToken();
      location.replace("/");
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
