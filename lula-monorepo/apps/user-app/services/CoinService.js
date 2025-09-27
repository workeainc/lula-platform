import BackendService from './BackendService';

class CoinService {
  // Get user's coin balance
  async getBalance(userId) {
    return BackendService.get(`/coin/balance/${userId}`);
  }

  // Purchase coins
  async purchaseCoins(userId, amount, paymentMethod = 'card', paymentId = null) {
    return BackendService.post('/coin/purchase', {
      userId,
      amount,
      paymentMethod,
      paymentId
    });
  }

  // Deduct coins (for calls)
  async deductCoins(userId, amount, callId = null, description = '') {
    return BackendService.post('/coin/deduct', {
      userId,
      amount,
      callId,
      description
    });
  }

  // Get transaction history
  async getTransactionHistory(userId, page = 1, limit = 20) {
    return BackendService.get(`/coin/transactions/${userId}`, {
      page,
      limit
    });
  }

  // Check if user has minimum balance for call
  async checkMinimumBalance(userId, callType = 'voice') {
    return BackendService.post('/coin/check-balance', {
      userId,
      callType
    });
  }

  // Validate balance before call
  async validateCallBalance(userId, callType = 'voice') {
    try {
      const result = await this.checkMinimumBalance(userId, callType);
      
      if (result.error) {
        return {
          error: true,
          message: result.message,
          canMakeCall: false
        };
      }

      const { hasMinimumBalance, currentBalance, minimumBalance } = result.data;
      
      return {
        error: false,
        canMakeCall: hasMinimumBalance,
        currentBalance,
        minimumBalance,
        message: hasMinimumBalance 
          ? 'Sufficient balance for call' 
          : `Insufficient balance. Need ${minimumBalance} coins, have ${currentBalance}`
      };
    } catch (error) {
      return {
        error: true,
        message: 'Failed to validate balance',
        canMakeCall: false
      };
    }
  }

  // Get coin plans (for recharge screen)
  async getCoinPlans() {
    // This could be dynamic from backend, but for now return static plans
    return {
      error: false,
      data: [
        { id: 1, coins: 100, price: 10, bonus: 0 },
        { id: 2, coins: 500, price: 45, bonus: 50 },
        { id: 3, coins: 1000, price: 80, bonus: 200 },
        { id: 4, coins: 2500, price: 180, bonus: 750 },
        { id: 5, coins: 5000, price: 350, bonus: 2000 },
        { id: 6, coins: 10000, price: 650, bonus: 5000 }
      ]
    };
  }

  // Process coin purchase
  async processPurchase(userId, planId, paymentMethod = 'card') {
    try {
      const plansResult = await this.getCoinPlans();
      if (plansResult.error) {
        return plansResult;
      }

      const plan = plansResult.data.find(p => p.id === planId);
      if (!plan) {
        return {
          error: true,
          message: 'Invalid plan selected'
        };
      }

      // Generate payment ID (in real app, this would come from payment gateway)
      const paymentId = `payment_${Date.now()}_${userId}`;

      return await this.purchaseCoins(userId, plan.coins, paymentMethod, paymentId);
    } catch (error) {
      return {
        error: true,
        message: 'Failed to process purchase'
      };
    }
  }
}

export default new CoinService();
