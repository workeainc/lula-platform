const axios = require('axios');

class MSG91Service {
  constructor() {
    this.apiKey = process.env.MSG91_API_KEY;
    this.senderId = process.env.MSG91_SENDER_ID;
    this.templateId = process.env.MSG91_TEMPLATE_ID;
    this.baseURL = 'https://api.msg91.com/api/v5';
    
    if (!this.apiKey) {
      console.warn('⚠️ MSG91_API_KEY not configured. OTP functionality will not work.');
    }
  }

  /**
   * Send OTP to a phone number
   * @param {string} phoneNumber - Phone number in international format (e.g., +1234567890)
   * @param {string} otp - 6-digit OTP code
   * @returns {Promise<Object>} - Success/error response
   */
  async sendOTP(phoneNumber, otp) {
    try {
      if (!this.apiKey) {
        console.log('📱 MSG91 not configured, using placeholder OTP:', otp);
        return { 
          error: false, 
          message: `OTP sent successfully (placeholder): ${otp}`,
          requestId: 'placeholder-' + Date.now()
        };
      }

      // Remove + from phone number for MSG91
      const cleanPhoneNumber = phoneNumber.replace('+', '');

      const response = await axios.post(`${this.baseURL}/otp`, {
        template_id: this.templateId,
        sender: this.senderId,
        short_url: "0", // Disable URL shortening
        mobiles: cleanPhoneNumber,
        var1: otp, // OTP variable in the template
      }, {
        headers: {
          'Authkey': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ MSG91 OTP sent successfully:', response.data);
      
      return {
        error: false,
        message: 'OTP sent successfully',
        requestId: response.data.request_id
      };

    } catch (error) {
      console.error('❌ MSG91 OTP send error:', error.response?.data || error.message);
      
      return {
        error: true,
        message: 'Failed to send OTP',
        details: error.response?.data || error.message
      };
    }
  }

  /**
   * Verify OTP (MSG91 doesn't provide server-side verification, so we'll handle it locally)
   * @param {string} phoneNumber - Phone number
   * @param {string} otp - OTP code to verify
   * @param {string} sentOtp - The OTP that was originally sent
   * @returns {Promise<Object>} - Verification result
   */
  async verifyOTP(phoneNumber, otp, sentOtp) {
    try {
      // For MSG91, we typically store the sent OTP and verify it locally
      // or use MSG91's OTP verification API if available
      
      if (!this.apiKey) {
        // Placeholder verification - accept any 6-digit OTP
        console.log('📱 MSG91 not configured, using placeholder verification');
        if (otp && otp.length === 6 && /^\d{6}$/.test(otp)) {
          return {
            error: false,
            message: 'OTP verified successfully (placeholder)'
          };
        } else {
          return {
            error: true,
            message: 'Invalid OTP format'
          };
        }
      }

      // In a real implementation, you would either:
      // 1. Compare with the stored OTP in your database
      // 2. Use MSG91's verify endpoint if available
      
      // For now, we'll implement a simple comparison
      if (otp === sentOtp) {
        return {
          error: false,
          message: 'OTP verified successfully'
        };
      } else {
        return {
          error: true,
          message: 'Invalid OTP'
        };
      }

    } catch (error) {
      console.error('❌ MSG91 OTP verification error:', error.message);
      
      return {
        error: true,
        message: 'OTP verification failed'
      };
    }
  }

  /**
   * Generate a random 6-digit OTP
   * @returns {string} - 6-digit OTP
   */
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Check service configuration status
   * @returns {Object} - Configuration status
   */
  getConfigStatus() {
    return {
      configured: !!this.apiKey,
      apiKey: this.apiKey ? '***' + this.apiKey.slice(-4) : 'Not set',
      senderId: this.senderId || 'Not set',
      templateId: this.templateId || 'Not set'
    };
  }
}

module.exports = new MSG91Service();
