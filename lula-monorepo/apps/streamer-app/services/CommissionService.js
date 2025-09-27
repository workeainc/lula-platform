import BackendService from './BackendService';

class CommissionService {
  // Get streamer's total earnings
  async getTotalEarnings(streamerId) {
    try {
      const result = await BackendService.get(`/coin/balance/${streamerId}`);
      
      if (result.error) {
        return result;
      }

      const { balance, totalEarned } = result.data;
      
      // Calculate commission (30% of total earned)
      const commissionRate = parseInt(process.env.COMMISSION_PERCENTAGE) || 30;
      const totalCommission = Math.floor(totalEarned * commissionRate / 100);
      
      return {
        error: false,
        data: {
          totalEarnings: totalEarned,
          totalCommission,
          currentBalance: balance,
          commissionRate
        }
      };
    } catch (error) {
      console.error('CommissionService getTotalEarnings error:', error);
      return { error: true, message: 'Failed to get earnings' };
    }
  }

  // Get commission history
  async getCommissionHistory(streamerId, page = 1, limit = 20) {
    try {
      const result = await BackendService.get(`/coin/transactions/${streamerId}`, {
        page,
        limit
      });

      if (result.error) {
        return result;
      }

      // Filter only commission transactions
      const commissionTransactions = result.data.transactions.filter(
        transaction => transaction.type === 'commission'
      );

      return {
        error: false,
        transactions: commissionTransactions,
        pagination: result.data.pagination
      };
    } catch (error) {
      console.error('CommissionService getCommissionHistory error:', error);
      return { error: true, message: 'Failed to get commission history' };
    }
  }

  // Get today's earnings
  async getTodaysEarnings(streamerId) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const result = await BackendService.get(`/coin/transactions/${streamerId}`, {
        page: 1,
        limit: 100
      });

      if (result.error) {
        return result;
      }

      // Filter today's commission transactions
      const todayTransactions = result.data.transactions.filter(transaction => {
        if (transaction.type !== 'commission') return false;
        
        const transactionDate = new Date(transaction.createdAt);
        return transactionDate >= today;
      });

      const todaysEarnings = todayTransactions.reduce((total, transaction) => {
        return total + transaction.amount;
      }, 0);

      return {
        error: false,
        data: {
          todaysEarnings,
          transactionCount: todayTransactions.length,
          transactions: todayTransactions
        }
      };
    } catch (error) {
      console.error('CommissionService getTodaysEarnings error:', error);
      return { error: true, message: 'Failed to get today\'s earnings' };
    }
  }

  // Get weekly earnings
  async getWeeklyEarnings(streamerId) {
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const result = await BackendService.get(`/coin/transactions/${streamerId}`, {
        page: 1,
        limit: 200
      });

      if (result.error) {
        return result;
      }

      // Filter this week's commission transactions
      const weekTransactions = result.data.transactions.filter(transaction => {
        if (transaction.type !== 'commission') return false;
        
        const transactionDate = new Date(transaction.createdAt);
        return transactionDate >= weekAgo;
      });

      const weeklyEarnings = weekTransactions.reduce((total, transaction) => {
        return total + transaction.amount;
      }, 0);

      return {
        error: false,
        data: {
          weeklyEarnings,
          transactionCount: weekTransactions.length,
          transactions: weekTransactions
        }
      };
    } catch (error) {
      console.error('CommissionService getWeeklyEarnings error:', error);
      return { error: true, message: 'Failed to get weekly earnings' };
    }
  }

  // Get monthly earnings
  async getMonthlyEarnings(streamerId) {
    try {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      
      const result = await BackendService.get(`/coin/transactions/${streamerId}`, {
        page: 1,
        limit: 500
      });

      if (result.error) {
        return result;
      }

      // Filter this month's commission transactions
      const monthTransactions = result.data.transactions.filter(transaction => {
        if (transaction.type !== 'commission') return false;
        
        const transactionDate = new Date(transaction.createdAt);
        return transactionDate >= monthAgo;
      });

      const monthlyEarnings = monthTransactions.reduce((total, transaction) => {
        return total + transaction.amount;
      }, 0);

      return {
        error: false,
        data: {
          monthlyEarnings,
          transactionCount: monthTransactions.length,
          transactions: monthTransactions
        }
      };
    } catch (error) {
      console.error('CommissionService getMonthlyEarnings error:', error);
      return { error: true, message: 'Failed to get monthly earnings' };
    }
  }

  // Get earnings analytics
  async getEarningsAnalytics(streamerId) {
    try {
      const [totalResult, todayResult, weekResult, monthResult] = await Promise.all([
        this.getTotalEarnings(streamerId),
        this.getTodaysEarnings(streamerId),
        this.getWeeklyEarnings(streamerId),
        this.getMonthlyEarnings(streamerId)
      ]);

      if (totalResult.error) {
        return totalResult;
      }

      return {
        error: false,
        data: {
          total: totalResult.data,
          today: todayResult.error ? { todaysEarnings: 0, transactionCount: 0 } : todayResult.data,
          week: weekResult.error ? { weeklyEarnings: 0, transactionCount: 0 } : weekResult.data,
          month: monthResult.error ? { monthlyEarnings: 0, transactionCount: 0 } : monthResult.data
        }
      };
    } catch (error) {
      console.error('CommissionService getEarningsAnalytics error:', error);
      return { error: true, message: 'Failed to get earnings analytics' };
    }
  }

  // Get call statistics
  async getCallStatistics(streamerId) {
    try {
      const result = await BackendService.get(`/call/history/${streamerId}`, {
        page: 1,
        limit: 100
      });

      if (result.error) {
        return result;
      }

      const calls = result.data.calls;
      
      // Calculate statistics
      const totalCalls = calls.length;
      const completedCalls = calls.filter(call => call.status === 'ended').length;
      const totalDuration = calls.reduce((total, call) => total + (call.duration || 0), 0);
      const totalCommission = calls.reduce((total, call) => total + (call.commissionEarned || 0), 0);
      const averageCallDuration = totalCalls > 0 ? Math.floor(totalDuration / totalCalls) : 0;

      return {
        error: false,
        data: {
          totalCalls,
          completedCalls,
          totalDuration,
          totalCommission,
          averageCallDuration,
          completionRate: totalCalls > 0 ? Math.round((completedCalls / totalCalls) * 100) : 0
        }
      };
    } catch (error) {
      console.error('CommissionService getCallStatistics error:', error);
      return { error: true, message: 'Failed to get call statistics' };
    }
  }

  // Get commission rate
  getCommissionRate() {
    return parseInt(process.env.COMMISSION_PERCENTAGE) || 30;
  }

  // Calculate commission for a given amount
  calculateCommission(amount) {
    const commissionRate = this.getCommissionRate();
    return Math.floor(amount * commissionRate / 100);
  }
}

export default new CommissionService();
