import axiosInstance from "../configs/axios.config";

class AccountService {
  async create(data) {
    try {
      const response = await axiosInstance.post('/admin/users', {
        ...data,
        role: 'ADMIN'
      });
      
      return { error: false, message: "Account Created Successfully", data: response.data };
    } catch (error) {
      if (error.response?.status === 409) {
        return this.handleError("Email is Already Taken");
      } else {
        return this.handleError(error.response?.data?.message || error.message);
      }
    }
  }

  async getAccount(callback) {
    try {
      const response = await axiosInstance.get('/admin/users', {
        params: { role: 'ADMIN' }
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
        message: error.response?.data?.message || 'Failed to get accounts' 
      };
    }
  }

  async updateStatus(id, newStatus) {
    try {
      const response = await axiosInstance.put(`/admin/users/${id}`, {
        status: newStatus
      });
      
      return { error: false, message: 'Status Updated Successfully', data: response.data };
    } catch (error) {
      return { 
        error: true, 
        message: error.response?.data?.message || error.message 
      };
    }
  }

  async getAccountById(id) {
    try {
      const response = await axiosInstance.get(`/admin/users/${id}`);
      return { error: false, data: response.data };
    } catch (error) {
      return { 
        error: true, 
        message: error.response?.data?.message || 'Failed to get account' 
      };
    }
  }

  async updateDetails(data) {
    try {
      const response = await axiosInstance.put(`/admin/users/${data.id}`, {
        name: data.name,
        phone: data.phone,
      });

      return { error: false, message: "Details Updated Successfully", data: response.data };
    } catch (error) {
      return { 
        error: true, 
        message: error.response?.data?.message || error.message 
      };
    }
  }

  handleError(message) {
    console.error(message);
    return { error: true, message };
  }
}

export default new AccountService();