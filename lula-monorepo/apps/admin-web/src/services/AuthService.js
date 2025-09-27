import axiosInstance from "../configs/axios.config";

class AuthService {
  async register(email, password) {
    try {
      const response = await axiosInstance.post('/auth/register', {
        email,
        password,
        role: 'ADMIN'
      });
      
      return { error: false, data: response.data };
    } catch (error) {
      if (error.response?.status === 409) {
        return this.handleError("Email is Already Taken");
      } else {
        return this.handleError(error.response?.data?.message || error.message);
      }
    }
  }

  async login(email, password) {
    try {
      const response = await axiosInstance.post('/auth/login', {
        email,
        password
      });
      
      return { error: false, data: response.data };
    } catch (error) {
      if (error.response?.status === 401) {
        return this.handleError("Invalid Credentials");
      } else {
        return this.handleError(error.response?.data?.message || error.message);
      }
    }
  }

  async updatePassword(data) {
    try {
      if (!data.password) return;
      
      const response = await axiosInstance.put('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.password
      });
      
      return { error: false, message: "Password Updated Successfully" };
    } catch (error) {
      if (error.response?.status === 401) {
        return { error: true, message: "Invalid Current Password" };
      } else {
        return { error: true, message: error.response?.data?.message || error.message };
      }
    }
  }

  async updateDetails(data) {
    try {
      const response = await axiosInstance.put('/user/profile', {
        name: data.name,
        phone: data.phone,
      });

      return { error: false, message: "Details Updated Successfully" };
    } catch (error) {
      return { error: true, message: error.response?.data?.message || error.message };
    }
  }

  handleError(message) {
    console.error(message);
    return { error: true, message };
  }
}

export default new AuthService();