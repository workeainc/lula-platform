import NewBaseService from "./NewBaseService";

class ChatService extends NewBaseService {
    constructor() {
        super('chats');
    }

    /**
     * Create a chat session between a user and a streamer
     * 
     * @param {string} userId - User ID
     * @param {string} streamerId - Streamer ID
     * @returns {Promise<Object>} - Chat ID and status
     */
    async createChat(userId, streamerId) {
        try {
            const response = await this.api.post(`/${this.collection}`, {
                userId: userId,
                streamerId: streamerId,
                lastMessage: '',
                createdAt: new Date().toISOString()
            });
            
            return { 
                error: false, 
                data: response.data.chatId || response.data._id 
            };
        } catch (error) {
            console.error('Error creating chat:', error);
            return { 
                error: true, 
                message: error.response?.data?.message || error.message 
            };
        }
    }

    /**
     * Get chat list for a streamer with pagination
     * 
     * @param {number} pageSize - Number of chats per page
     * @param {number} page - Page number
     * @param {string} streamerId - Streamer ID
     * @returns {Promise<Object>} - Chat list with pagination info
     */
    async getChatList(pageSize = 10, page = 1, streamerId) {
        try {
            const response = await this.api.get(`/${this.collection}`, {
                params: {
                    streamerId: streamerId,
                    limit: pageSize,
                    page: page
                }
            });

            const chats = response.data.chats || [];
            
            return {
                error: false,
                data: chats,
                hasMore: response.data.hasMore || false,
                totalPages: response.data.totalPages || 1,
                currentPage: page
            };
        } catch (error) {
            console.error('Error fetching chat list:', error);
            return { 
                error: true, 
                message: error.response?.data?.message || error.message 
            };
        }
    }

    /**
     * Get chat list for a user with pagination
     * 
     * @param {number} pageSize - Number of chats per page
     * @param {number} page - Page number
     * @param {string} userId - User ID
     * @returns {Promise<Object>} - Chat list with pagination info
     */
    async getUserChatList(pageSize = 10, page = 1, userId) {
        try {
            const response = await this.api.get(`/${this.collection}/user`, {
                params: {
                    userId: userId,
                    limit: pageSize,
                    page: page
                }
            });

            const chats = response.data.chats || [];
            
            return {
                error: false,
                data: chats,
                hasMore: response.data.hasMore || false,
                totalPages: response.data.totalPages || 1,
                currentPage: page
            };
        } catch (error) {
            console.error('Error fetching user chat list:', error);
            return { 
                error: true, 
                message: error.response?.data?.message || error.message 
            };
        }
    }

    /**
     * Get chat messages with pagination
     * 
     * @param {string} chatId - Chat ID
     * @param {number} pageSize - Number of messages per page
     * @param {number} page - Page number
     * @returns {Promise<Object>} - Messages with pagination info
     */
    async getMessages(chatId, pageSize = 20, page = 1) {
        try {
            const response = await this.api.get(`/${this.collection}/${chatId}/messages`, {
                params: {
                    limit: pageSize,
                    page: page
                }
            });

            const messages = response.data.messages || [];
            
            return {
                error: false,
                data: messages,
                hasMore: response.data.hasMore || false,
                totalPages: response.data.totalPages || 1,
                currentPage: page
            };
        } catch (error) {
            console.error('Error fetching messages:', error);
            return { 
                error: true, 
                message: error.response?.data?.message || error.message 
            };
        }
    }

    /**
     * Send a message
     * 
     * @param {string} chatId - Chat ID
     * @param {string} senderId - Sender ID
     * @param {string} message - Message content
     * @param {string} type - Message type (text, image, etc.)
     * @returns {Promise<Object>} - Sent message data
     */
    async sendMessage(chatId, senderId, message, type = 'text') {
        try {
            const response = await this.api.post(`/${this.collection}/${chatId}/messages`, {
                senderId: senderId,
                message: message,
                type: type,
                timestamp: new Date().toISOString()
            });
            
            return {
                error: false,
                data: response.data
            };
        } catch (error) {
            console.error('Error sending message:', error);
            return { 
                error: true, 
                message: error.response?.data?.message || error.message 
            };
        }
    }

    /**
     * Mark messages as read
     * 
     * @param {string} chatId - Chat ID
     * @param {string} userId - User ID
     * @returns {Promise<Object>} - Update status
     */
    async markAsRead(chatId, userId) {
        try {
            const response = await this.api.patch(`/${this.collection}/${chatId}/read`, {
                userId: userId,
                readAt: new Date().toISOString()
            });
            
            return {
                error: false,
                data: response.data
            };
        } catch (error) {
            console.error('Error marking messages as read:', error);
            return { 
                error: true, 
                message: error.response?.data?.message || error.message 
            };
        }
    }

    /**
     * Delete a chat
     * 
     * @param {string} chatId - Chat ID
     * @returns {Promise<Object>} - Deletion status
     */
    async deleteChat(chatId) {
        try {
            const response = await this.api.delete(`/${this.collection}/${chatId}`);
            
            return {
                error: false,
                data: response.data
            };
        } catch (error) {
            console.error('Error deleting chat:', error);
            return { 
                error: true, 
                message: error.response?.data?.message || error.message 
            };
        }
    }

    /**
     * Block a chat
     * 
     * @param {string} chatId - Chat ID
     * @param {string} userId - User ID who is blocking
     * @returns {Promise<Object>} - Block status
     */
    async blockChat(chatId, userId) {
        try {
            const response = await this.api.patch(`/${this.collection}/${chatId}/block`, {
                userId: userId,
                blockedAt: new Date().toISOString()
            });
            
            return {
                error: false,
                data: response.data
            };
        } catch (error) {
            console.error('Error blocking chat:', error);
            return { 
                error: true, 
                message: error.response?.data?.message || error.message 
            };
        }
    }

    /**
     * Unblock a chat
     * 
     * @param {string} chatId - Chat ID
     * @param {string} userId - User ID who is unblocking
     * @returns {Promise<Object>} - Unblock status
     */
    async unblockChat(chatId, userId) {
        try {
            const response = await this.api.patch(`/${this.collection}/${chatId}/unblock`, {
                userId: userId,
                unblockedAt: new Date().toISOString()
            });
            
            return {
                error: false,
                data: response.data
            };
        } catch (error) {
            console.error('Error unblocking chat:', error);
            return { 
                error: true, 
                message: error.response?.data?.message || error.message 
            };
        }
    }

    /**
     * Get chat statistics
     * 
     * @param {string} chatId - Chat ID
     * @returns {Promise<Object>} - Chat statistics
     */
    async getChatStats(chatId) {
        try {
            const response = await this.api.get(`/${this.collection}/${chatId}/stats`);
            
            return {
                error: false,
                data: response.data
            };
        } catch (error) {
            console.error('Error fetching chat stats:', error);
            return { 
                error: true, 
                message: error.response?.data?.message || error.message 
            };
        }
    }

    /**
     * Generate chat ID from user and streamer IDs
     * 
     * @param {string} userId - User ID
     * @param {string} streamerId - Streamer ID
     * @returns {string} - Generated chat ID
     */
    getChatId(userId, streamerId) {
        return [userId, streamerId].sort().join('_');
    }

    /**
     * Set up real-time message listener (WebSocket connection)
     * 
     * @param {string} chatId - Chat ID
     * @param {Function} callback - Callback function for new messages
     * @returns {Function} - Cleanup function
     */
    setupMessageListener(chatId, callback) {
        // This would typically use WebSocket or Server-Sent Events
        // For now, we'll implement polling as a fallback
        const pollInterval = setInterval(async () => {
            try {
                const response = await this.getMessages(chatId, 1, 1);
                if (!response.error && response.data.length > 0) {
                    callback(response.data[0]);
                }
            } catch (error) {
                console.error('Error in message polling:', error);
            }
        }, 5000); // Poll every 5 seconds

        // Return cleanup function
        return () => clearInterval(pollInterval);
    }
}

export default ChatService;
