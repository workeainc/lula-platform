import axiosInstance from "../configs/axios.config";

class BaseService {
  #collection;
  
  constructor(collectionName) {
    this.#collection = collectionName;
  }

  handleError(message) {
    console.error(message);
    return { error: true, message };
  }

  // Convert data to API format
  toAPI(data) {
    return {
      ...data,
      createdAt: new Date(),
    };
  }

  // Convert API response to local format
  fromAPI(data) {
    return {
      ...data,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
    };
  }

  async update(docId, data) {
    try {
      const response = await axiosInstance.put(`/${this.#collection}/${docId}`, data);
      return { success: true, message: "Document updated successfully", data: response.data };
    } catch (error) {
      console.error(error);
      return { success: false, message: "Failed to update document" };
    }
  }

  async delete(docId) {
    try {
      await axiosInstance.delete(`/${this.#collection}/${docId}`);
      return { success: true, message: "Document deleted successfully" };
    } catch (error) {
      return { success: false, message: "Failed to delete document" };
    }
  }

  async getAsMap(collectionName) {
    try {
      const response = await axiosInstance.get(`/${collectionName}`);
      const map = new Map();
      
      if (response.data && Array.isArray(response.data)) {
        response.data.forEach((item) => {
          map.set(item._id || item.id, item);
        });
      }
      
      return map;
    } catch (error) {
      console.error(`Error fetching ${collectionName}:`, error);
      return new Map();
    }
  }

  async uploadFiles(file, path) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', path);
      
      const response = await axiosInstance.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data.url;
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  }

  // Generic API methods
  async getAll(params = {}) {
    try {
      const response = await axiosInstance.get(`/${this.#collection}`, { params });
      return { error: false, data: response.data };
    } catch (error) {
      return { 
        error: true, 
        message: error.response?.data?.message || `Failed to get ${this.#collection}` 
      };
    }
  }

  async getById(id) {
    try {
      const response = await axiosInstance.get(`/${this.#collection}/${id}`);
      return { error: false, data: response.data };
    } catch (error) {
      return { 
        error: true, 
        message: error.response?.data?.message || `Failed to get ${this.#collection}` 
      };
    }
  }

  async create(data) {
    try {
      const response = await axiosInstance.post(`/${this.#collection}`, data);
      return { error: false, data: response.data };
    } catch (error) {
      return { 
        error: true, 
        message: error.response?.data?.message || `Failed to create ${this.#collection}` 
      };
    }
  }
}

export default BaseService;