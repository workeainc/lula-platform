import axiosInstance from "../configs/axios.config";

class UserService {
  async getUser(role, callback) {
    try {
      const response = await axiosInstance.get('/admin/users', {
        params: { role }
      });
      
      if (callback && typeof callback === 'function') {
        callback(response.data);
      }
      
      return { error: false, data: response.data };
    } catch (error) {
      if (callback && typeof callback === 'function') {
        callback([]);
      }
      return { 
        error: true, 
        message: error.response?.data?.message || 'Failed to get users' 
      };
    }
  }

  async approveUser(userId) {
    try {
      const response = await axiosInstance.put(`/admin/users/${userId}`, {
        status: true
      });
      return { error: false, data: response.data };
    } catch (error) {
      return { 
        error: true, 
        message: error.response?.data?.message || 'Failed to approve user' 
      };
    }
  }

  async getUserCountByRole() {
    try {
      const response = await axiosInstance.get('/admin/dashboard');
      return { error: false, data: response.data };
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      return {
        error: true,
        data: {
          TOTALUSER: 0,
          USERCHART: [],
          STREAMERCHART: [],
          STREAMER: 0,
          TRANSACTION: 0,
          WITHDRAWAL_REQUESTS: 0,
          TOPUSERCOINS: [],
          TOPSTREAMERFOLLOWERS: []
        }
      };
    }
  }

  // Additional methods for user management
  async getAllUsers(params = {}) {
    try {
      const response = await axiosInstance.get('/admin/users', { params });
      return { error: false, data: response.data };
    } catch (error) {
      return { 
        error: true, 
        message: error.response?.data?.message || 'Failed to get users' 
      };
    }
  }

  async updateUser(userId, data) {
    try {
      const response = await axiosInstance.put(`/admin/users/${userId}`, data);
      return { error: false, data: response.data };
    } catch (error) {
      return { 
        error: true, 
        message: error.response?.data?.message || 'Failed to update user' 
      };
    }
  }

  async deleteUser(userId) {
    try {
      const response = await axiosInstance.delete(`/admin/users/${userId}`);
      return { error: false, data: response.data };
    } catch (error) {
      return { 
        error: true, 
        message: error.response?.data?.message || 'Failed to delete user' 
      };
    }
  }
}

export default new UserService();