const RealTimeBillingService = require('../src/services/RealTimeBillingService');
const Call = require('../src/models/Call');
const Coin = require('../src/models/Coin');
const Transaction = require('../src/models/Transaction');
const User = require('../src/models/User');

// Mock Socket.io
const mockIo = {
  to: jest.fn(() => ({
    emit: jest.fn()
  }))
};

describe('RealTimeBillingService', () => {
  let billingService;
  let testCall;
  let callerWallet;
  let streamerWallet;

  beforeEach(async () => {
    // Clear all collections
    await User.deleteMany({});
    await Call.deleteMany({});
    await Coin.deleteMany({});
    await Transaction.deleteMany({});

    // Create test users
    const caller = await User.create({
      phoneNumber: '+1234567890',
      role: 'USER',
      name: 'Test Caller'
    });

    const streamer = await User.create({
      phoneNumber: '+0987654321',
      role: 'STREAMER',
      name: 'Test Streamer'
    });

    // Create test call
    testCall = await Call.create({
      callerId: caller._id,
      receiverId: streamer._id,
      callType: 'voice',
      streamCallId: 'test_call_123',
      status: 'ongoing',
      startTime: new Date(),
      coinsPerMinute: 49
    });

    // Create wallets
    callerWallet = await Coin.create({
      userId: caller._id,
      balance: 1000,
      totalPurchased: 1000,
      totalSpent: 0,
      totalEarned: 0
    });

    streamerWallet = await Coin.create({
      userId: streamer._id,
      balance: 0,
      totalPurchased: 0,
      totalSpent: 0,
      totalEarned: 0
    });

    // Initialize billing service
    billingService = new RealTimeBillingService(mockIo);
  });

  afterEach(async () => {
    // Clean up
    await User.deleteMany({});
    await Call.deleteMany({});
    await Coin.deleteMany({});
    await Transaction.deleteMany({});
  });

  describe('startBilling', () => {
    test('should start billing for a valid call', async () => {
      await billingService.startBilling(testCall._id);

      const billingStatus = billingService.getBillingStatus(testCall._id);
      expect(billingStatus).toBeDefined();
      expect(billingStatus.isActive).toBe(true);
      expect(billingStatus.callId).toBe(testCall._id.toString());
    });

    test('should not start billing for non-existent call', async () => {
      const nonExistentCallId = new mongoose.Types.ObjectId();
      
      await expect(billingService.startBilling(nonExistentCallId))
        .rejects.toThrow('Call not found');
    });

    test('should not start billing for non-ongoing call', async () => {
      await Call.findByIdAndUpdate(testCall._id, { status: 'ended' });
      
      await expect(billingService.startBilling(testCall._id))
        .rejects.toThrow('not in ongoing status');
    });

    test('should emit billing started events', async () => {
      await billingService.startBilling(testCall._id);

      expect(mockIo.to).toHaveBeenCalledWith(testCall.callerId.toString());
      expect(mockIo.to).toHaveBeenCalledWith(testCall.receiverId.toString());
    });
  });

  describe('processMinuteBilling', () => {
    beforeEach(async () => {
      await billingService.startBilling(testCall._id);
    });

    test('should process minute billing correctly', async () => {
      // Mock the billing data to simulate first minute
      const billingData = billingService.activeCalls.get(testCall._id.toString());
      billingData.startTime = new Date(Date.now() - 60000); // 1 minute ago
      billingData.lastBilledMinute = 0;

      await billingService.processMinuteBilling(testCall._id);

      // Check that coins were deducted from caller
      const updatedCallerWallet = await Coin.findById(callerWallet._id);
      expect(updatedCallerWallet.balance).toBe(1000 - 49);
      expect(updatedCallerWallet.totalSpent).toBe(49);

      // Check that commission was added to streamer
      const updatedStreamerWallet = await Coin.findById(streamerWallet._id);
      const expectedCommission = Math.floor(49 * 0.3); // 30% commission
      expect(updatedStreamerWallet.balance).toBe(expectedCommission);
      expect(updatedStreamerWallet.totalEarned).toBe(expectedCommission);

      // Check that transactions were created
      const deductionTransaction = await Transaction.findOne({
        userId: testCall.callerId,
        type: 'deduction'
      });
      expect(deductionTransaction).toBeDefined();
      expect(deductionTransaction.amount).toBe(-49);

      const commissionTransaction = await Transaction.findOne({
        userId: testCall.receiverId,
        type: 'commission'
      });
      expect(commissionTransaction).toBeDefined();
      expect(commissionTransaction.amount).toBe(expectedCommission);
    });

    test('should stop billing if insufficient balance', async () => {
      // Set caller balance to insufficient amount
      await Coin.findByIdAndUpdate(callerWallet._id, { balance: 10 });

      // Mock the billing data
      const billingData = billingService.activeCalls.get(testCall._id.toString());
      billingData.startTime = new Date(Date.now() - 60000);
      billingData.lastBilledMinute = 0;

      await billingService.processMinuteBilling(testCall._id);

      // Check that billing was stopped
      const billingStatus = billingService.getBillingStatus(testCall._id);
      expect(billingStatus).toBeNull();

      // Check that call was ended
      const updatedCall = await Call.findById(testCall._id);
      expect(updatedCall.status).toBe('ended');
      expect(updatedCall.endReason).toBe('insufficient_balance');
    });

    test('should emit real-time balance updates', async () => {
      const billingData = billingService.activeCalls.get(testCall._id.toString());
      billingData.startTime = new Date(Date.now() - 60000);
      billingData.lastBilledMinute = 0;

      await billingService.processMinuteBilling(testCall._id);

      expect(mockIo.to).toHaveBeenCalledWith(testCall.callerId.toString());
      expect(mockIo.to).toHaveBeenCalledWith(testCall.receiverId.toString());
    });
  });

  describe('stopBilling', () => {
    beforeEach(async () => {
      await billingService.startBilling(testCall._id);
    });

    test('should stop billing correctly', async () => {
      await billingService.stopBilling(testCall._id);

      const billingStatus = billingService.getBillingStatus(testCall._id);
      expect(billingStatus).toBeNull();

      expect(mockIo.to).toHaveBeenCalledWith(testCall.callerId.toString());
      expect(mockIo.to).toHaveBeenCalledWith(testCall.receiverId.toString());
    });

    test('should emit billing stopped events', async () => {
      await billingService.stopBilling(testCall._id, 'call_ended');

      expect(mockIo.to).toHaveBeenCalledWith(testCall.callerId.toString());
      expect(mockIo.to).toHaveBeenCalledWith(testCall.receiverId.toString());
    });
  });

  describe('getBillingStatus', () => {
    test('should return null for non-existent billing', () => {
      const nonExistentCallId = new mongoose.Types.ObjectId();
      const status = billingService.getBillingStatus(nonExistentCallId);
      expect(status).toBeNull();
    });

    test('should return billing status for active billing', async () => {
      await billingService.startBilling(testCall._id);
      
      const status = billingService.getBillingStatus(testCall._id);
      expect(status).toBeDefined();
      expect(status.callId).toBe(testCall._id.toString());
      expect(status.isActive).toBe(true);
    });
  });

  describe('getAllActiveBilling', () => {
    test('should return empty array when no active billing', () => {
      const activeBilling = billingService.getAllActiveBilling();
      expect(activeBilling).toEqual([]);
    });

    test('should return all active billing sessions', async () => {
      await billingService.startBilling(testCall._id);
      
      const activeBilling = billingService.getAllActiveBilling();
      expect(activeBilling).toHaveLength(1);
      expect(activeBilling[0].callId).toBe(testCall._id.toString());
    });
  });

  describe('cleanupInactiveBilling', () => {
    test('should cleanup inactive billing sessions', async () => {
      await billingService.startBilling(testCall._id);
      
      // Mock old billing data
      const billingData = billingService.activeCalls.get(testCall._id.toString());
      billingData.startTime = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago

      await billingService.cleanupInactiveBilling();

      const billingStatus = billingService.getBillingStatus(testCall._id);
      expect(billingStatus).toBeNull();
    });
  });
});
