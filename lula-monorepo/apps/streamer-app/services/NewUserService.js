import NewBaseService from "./NewBaseService";

class UserService extends NewBaseService {
    constructor() {
        super('users');
    }

    /**
     * Fetch users with the role 'USER' and support pagination for infinite scroll.
     * 
     * @param {number} pageSize - Number of users to fetch per request (for pagination)
     * @param {number} page - Page number for pagination
     * @returns {Promise<Object>} - Object containing users data and pagination info
     */
    async getUsers(pageSize = 20, page = 1) {
        try {
            const response = await this.api.get(`/${this.collection}`, {
                params: {
                    role: 'USER',
                    isDeleted: false,
                    statusShow: true,
                    limit: pageSize,
                    page: page
                }
            });

            const users = response.data.users || [];
            
            // Filter out users with missing or empty phoneNumber
            const filteredUsers = users.filter(user => 
                user.phoneNumber?.trim() && 
                user.name?.trim() &&
                user.statusShow === true
            );

            return {
                users: filteredUsers,
                hasMore: response.data.hasMore || false,
                totalPages: response.data.totalPages || 1,
                currentPage: page
            };
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    }

    /**
     * Fetch users by search query with pagination
     * 
     * @param {string} searchQuery - Search term for name or phone number
     * @param {number} pageSize - Number of users to fetch per request
     * @param {number} page - Page number for pagination
     * @returns {Promise<Object>} - Object containing filtered users data
     */
    async searchUsers(searchQuery, pageSize = 20, page = 1) {
        try {
            const response = await this.api.get(`/${this.collection}/search`, {
                params: {
                    q: searchQuery,
                    role: 'USER',
                    isDeleted: false,
                    statusShow: true,
                    limit: pageSize,
                    page: page
                }
            });

            const users = response.data.users || [];
            
            // Filter out users with missing or empty phoneNumber
            const filteredUsers = users.filter(user => 
                user.phoneNumber?.trim() && 
                user.name?.trim() &&
                user.statusShow === true
            );

            return {
                users: filteredUsers,
                hasMore: response.data.hasMore || false,
                totalPages: response.data.totalPages || 1,
                currentPage: page
            };
        } catch (error) {
            console.error('Error searching users:', error);
            throw error;
        }
    }

    /**
     * Get user by ID
     * 
     * @param {string} userId - User ID
     * @returns {Promise<Object>} - User data
     */
    async getUserById(userId) {
        try {
            const response = await this.api.get(`/${this.collection}/${userId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching user by ID:', error);
            throw error;
        }
    }

    /**
     * Get user by phone number
     * 
     * @param {string} phoneNumber - Phone number
     * @returns {Promise<Object>} - User data
     */
    async getUserByPhone(phoneNumber) {
        try {
            const response = await this.api.get(`/${this.collection}/phone/${phoneNumber}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching user by phone:', error);
            throw error;
        }
    }

    /**
     * Update user profile
     * 
     * @param {string} userId - User ID
     * @param {Object} updateData - Data to update
     * @returns {Promise<Object>} - Updated user data
     */
    async updateUser(userId, updateData) {
        try {
            const response = await this.api.put(`/${this.collection}/${userId}`, updateData);
            return response.data;
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }

    /**
     * Update user's online status
     * 
     * @param {string} userId - User ID
     * @param {boolean} isOnline - Online status
     * @returns {Promise<Object>} - Updated user data
     */
    async updateOnlineStatus(userId, isOnline) {
        try {
            const response = await this.api.patch(`/${this.collection}/${userId}/status`, {
                isOnline: isOnline,
                lastSeen: new Date().toISOString()
            });
            return response.data;
        } catch (error) {
            console.error('Error updating online status:', error);
            throw error;
        }
    }

    /**
     * Block or unblock a user
     * 
     * @param {string} userId - User ID to block/unblock
     * @param {boolean} isBlocked - Block status
     * @returns {Promise<Object>} - Updated user data
     */
    async toggleBlockUser(userId, isBlocked) {
        try {
            const response = await this.api.patch(`/${this.collection}/${userId}/block`, {
                isBlocked: isBlocked
            });
            return response.data;
        } catch (error) {
            console.error('Error toggling block status:', error);
            throw error;
        }
    }

    /**
     * Get blocked users list
     * 
     * @returns {Promise<Array>} - Array of blocked user IDs
     */
    async getBlockedUsers() {
        try {
            const response = await this.api.get(`/${this.collection}/blocked`);
            return response.data.blockedUsers || [];
        } catch (error) {
            console.error('Error fetching blocked users:', error);
            throw error;
        }
    }

    /**
     * Report a user
     * 
     * @param {string} userId - User ID to report
     * @param {string} reason - Report reason
     * @param {string} description - Additional description
     * @returns {Promise<Object>} - Report confirmation
     */
    async reportUser(userId, reason, description = '') {
        try {
            const response = await this.api.post(`/${this.collection}/${userId}/report`, {
                reason: reason,
                description: description,
                reportedAt: new Date().toISOString()
            });
            return response.data;
        } catch (error) {
            console.error('Error reporting user:', error);
            throw error;
        }
    }

    /**
     * Get user statistics
     * 
     * @param {string} userId - User ID
     * @returns {Promise<Object>} - User statistics
     */
    async getUserStats(userId) {
        try {
            const response = await this.api.get(`/${this.collection}/${userId}/stats`);
            return response.data;
        } catch (error) {
            console.error('Error fetching user stats:', error);
            throw error;
        }
    }

    /**
     * Update user's profile picture
     * 
     * @param {string} userId - User ID
     * @param {FormData} imageData - Image file data
     * @returns {Promise<Object>} - Updated user data with new profile picture URL
     */
    async updateProfilePicture(userId, imageData) {
        try {
            const response = await this.api.post(`/${this.collection}/${userId}/profile-picture`, imageData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error updating profile picture:', error);
            throw error;
        }
    }

    /**
     * Delete user account
     * 
     * @param {string} userId - User ID
     * @returns {Promise<Object>} - Deletion confirmation
     */
    async deleteUser(userId) {
        try {
            const response = await this.api.delete(`/${this.collection}/${userId}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }
}

export default UserService;
