import axiosInstance from "../configs/axios.config";

class WithdrawService {
  async getAllWithdrawals(callback) {
    try {
      const response = await axiosInstance.get('/admin/withdrawals');
      
      if (callback && typeof callback === 'function') {
        callback(response.data.withdrawals || []);
      }
      
      return { error: false, data: response.data };
    } catch (error) {
      if (callback && typeof callback === 'function') {
        callback([]);
      }
      console.error("Error in getAllWithdrawals:", error);
      return { 
        error: true, 
        message: error.response?.data?.message || 'Failed to get withdrawals' 
      };
    }
  }

  async updateWithdrawalStatus(withdrawalId, status) {
    try {
      if (!["pending", "completed", "rejected"].includes(status)) {
        throw new Error("Invalid status");
      }
      
      const response = await axiosInstance.put(`/admin/withdrawals/${withdrawalId}`, {
        status
      });
      
      console.log(`Withdrawal ${withdrawalId} status updated to: ${status}`);
      return { error: false, message: `Withdrawal ${status}`, data: response.data };
    } catch (error) {
      console.error("Error updating withdrawal status:", error);
      return { 
        error: true, 
        message: error.response?.data?.message || error.message 
      };
    }
  }

  async getWithdrawalById(id) {
    try {
      const response = await axiosInstance.get(`/admin/withdrawals/${id}`);
      return { error: false, data: response.data };
    } catch (error) {
      return { 
        error: true, 
        message: error.response?.data?.message || 'Failed to get withdrawal' 
      };
    }
  }

  async getAllWithdrawalsList(params = {}) {
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
}

export default new WithdrawService();