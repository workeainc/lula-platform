import axiosInstance from "../configs/axios.config";

class AdminService {
  // Dashboard
  async getDashboard() {
    try {
      const response = await axiosInstance.get('/admin/dashboard', { timeout: 5000 });
      return { error: false, data: response.data };
    } catch (error) {
      return { 
        error: true, 
        message: error.response?.data?.message || 'Failed to get dashboard data' 
      };
    }
  }

  // Users Management
  async getUsers(params = {}) {
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

  // Calls Management
  async getCalls(params = {}) {
    try {
      const response = await axiosInstance.get('/admin/calls', { params });
      return { error: false, data: response.data };
    } catch (error) {
      return { 
        error: true, 
        message: error.response?.data?.message || 'Failed to get calls' 
      };
    }
  }

  async getCallAnalytics(params = {}) {
    try {
      const response = await axiosInstance.get('/admin/calls/analytics', { params });
      return { error: false, data: response.data };
    } catch (error) {
      return { 
        error: true, 
        message: error.response?.data?.message || 'Failed to get call analytics' 
      };
    }
  }

  // Transactions Management
  async getTransactions(params = {}) {
    try {
      const response = await axiosInstance.get('/admin/transactions', { params });
      return { error: false, data: response.data };
    } catch (error) {
      return { 
        error: true, 
        message: error.response?.data?.message || 'Failed to get transactions' 
      };
    }
  }

  // Commission Settings
  async getCommissionSettings() {
    try {
      const response = await axiosInstance.get('/commission');
      return { error: false, data: response.data };
    } catch (error) {
      return { 
        error: true, 
        message: error.response?.data?.message || 'Failed to get commission settings' 
      };
    }
  }

  async updateCommissionSettings(data) {
    try {
      const response = await axiosInstance.put('/commission', data);
      return { error: false, data: response.data };
    } catch (error) {
      return { 
        error: true, 
        message: error.response?.data?.message || 'Failed to update commission settings' 
      };
    }
  }

  // Notifications
  async getNotifications(params = {}) {
    try {
      const response = await axiosInstance.get('/notifications', { params });
      return { error: false, data: response.data };
    } catch (error) {
      return { 
        error: true, 
        message: error.response?.data?.message || 'Failed to get notifications' 
      };
    }
  }

  async sendBroadcastNotification(data) {
    try {
      const response = await axiosInstance.post('/notifications/admin/broadcast', data);
      return { error: false, data: response.data };
    } catch (error) {
      return { 
        error: true, 
        message: error.response?.data?.message || 'Failed to send broadcast notification' 
      };
    }
  }

  // Chat Management
  async getChats(params = {}) {
    try {
      const response = await axiosInstance.get('/chat/list', { params });
      return { error: false, data: response.data };
    } catch (error) {
      return { 
        error: true, 
        message: error.response?.data?.message || 'Failed to get chats' 
      };
    }
  }

  async getChatMessages(chatId, params = {}) {
    try {
      const response = await axiosInstance.get(`/chat/${chatId}/messages`, { params });
      return { error: false, data: response.data };
    } catch (error) {
      return { 
        error: true, 
        message: error.response?.data?.message || 'Failed to get chat messages' 
      };
    }
  }

  // Withdrawals Management
  async getWithdrawals(params = {}) {
    try {
      const response = await axiosInstance.get('/admin/withdrawals', { params });
      return { error: false, data: response.data };
    } catch (error) {
      return { 
        error: true, 
        message: error.response?.data?.message || 'Failed to get withdrawals' 
      };
    }
  }

  async updateWithdrawalStatus(withdrawalId, data) {
    try {
      const response = await axiosInstance.put(`/admin/withdrawals/${withdrawalId}`, data);
      return { error: false, data: response.data };
    } catch (error) {
      return { 
        error: true, 
        message: error.response?.data?.message || 'Failed to update withdrawal status' 
      };
    }
  }

  async getWithdrawalAnalytics(params = {}) {
    try {
      const response = await axiosInstance.get('/admin/withdrawals/analytics/overview', { params });
      return { error: false, data: response.data };
    } catch (error) {
      return { 
        error: true, 
        message: error.response?.data?.message || 'Failed to get withdrawal analytics' 
      };
    }
  }

  // System Health
  async getSystemHealth() {
    try {
      const response = await axiosInstance.get('/health');
      return { error: false, data: response.data };
    } catch (error) {
      return { 
        error: true, 
        message: error.response?.data?.message || 'Failed to get system health' 
      };
    }
  }
}

export default new AdminService();
