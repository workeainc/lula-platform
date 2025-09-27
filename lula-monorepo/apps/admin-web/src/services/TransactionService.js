import axiosInstance from "../configs/axios.config";

class TransactionService {
  async getTransaction(type, callback) {
    try {
      const response = await axiosInstance.get('/admin/transactions', {
        params: { type }
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
        message: error.response?.data?.message || 'Failed to get transactions' 
      };
    }
  }

  async getAllTransactions(params = {}) {
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

  async getTransactionById(id) {
    try {
      const response = await axiosInstance.get(`/admin/transactions/${id}`);
      return { error: false, data: response.data };
    } catch (error) {
      return { 
        error: true, 
        message: error.response?.data?.message || 'Failed to get transaction' 
      };
    }
  }

  async updateTransaction(id, data) {
    try {
      const response = await axiosInstance.put(`/admin/transactions/${id}`, data);
      return { error: false, data: response.data };
    } catch (error) {
      return { 
        error: true, 
        message: error.response?.data?.message || 'Failed to update transaction' 
      };
    }
  }
}

export default new TransactionService();