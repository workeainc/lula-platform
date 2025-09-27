import axiosInstance from "../configs/axios.config";

class AdminAuthService {
  async sendOTP(phoneNumber) {
    try {
      const response = await axiosInstance.post('/auth/register', {
        phoneNumber,
        role: 'ADMIN'
      });
      return { error: false, data: response.data };
    } catch (error) {
      return { 
        error: true, 
        message: error.response?.data?.message || 'Failed to send OTP' 
      };
    }
  }

  async verifyOTP(phoneNumber, otp) {
    try {
      const response = await axiosInstance.post('/auth/verify-otp', {
        phoneNumber,
        otp
      });
      return { error: false, data: response.data };
    } catch (error) {
      return { 
        error: true, 
        message: error.response?.data?.message || 'Invalid OTP' 
      };
    }
  }

  async getProfile() {
    try {
      const response = await axiosInstance.get('/user/profile');
      return { error: false, data: response.data };
    } catch (error) {
      return { 
        error: true, 
        message: error.response?.data?.message || 'Failed to get profile' 
      };
    }
  }

  async logout() {
    // Clear token from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // Helper method to check if user is admin
  isAdmin(user) {
    return user && user.role === 'ADMIN';
  }

  // Helper method to get stored token
  getToken() {
    return localStorage.getItem('token');
  }

  // Helper method to get stored user
  getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Helper method to set token and user
  setAuth(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }
}

export default new AdminAuthService();
