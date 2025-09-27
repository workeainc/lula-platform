const mongoose = require('mongoose');
const User = require('../src/models/User');
const Call = require('../src/models/Call');
const Coin = require('../src/models/Coin');
const Transaction = require('../src/models/Transaction');

describe('User Model', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  test('should create a user with valid data', async () => {
    const userData = {
      phoneNumber: '+1234567890',
      role: 'USER',
      name: 'John Doe',
      age: 25,
      gender: 'male'
    };

    const user = await User.create(userData);
    
    expect(user.phoneNumber).toBe(userData.phoneNumber);
    expect(user.role).toBe(userData.role);
    expect(user.name).toBe(userData.name);
    expect(user.age).toBe(userData.age);
    expect(user.gender).toBe(userData.gender);
    expect(user.isOnline).toBe(false);
    expect(user.isDeleted).toBe(false);
    expect(user.isVerified).toBe(false);
  });

  test('should require phoneNumber', async () => {
    const userData = {
      role: 'USER',
      name: 'John Doe'
    };

    await expect(User.create(userData)).rejects.toThrow();
  });

  test('should require role', async () => {
    const userData = {
      phoneNumber: '+1234567890',
      name: 'John Doe'
    };

    await expect(User.create(userData)).rejects.toThrow();
  });

  test('should enforce unique phoneNumber', async () => {
    const userData = {
      phoneNumber: '+1234567890',
      role: 'USER',
      name: 'John Doe'
    };

    await User.create(userData);
    await expect(User.create(userData)).rejects.toThrow();
  });

  test('should validate role enum', async () => {
    const userData = {
      phoneNumber: '+1234567890',
      role: 'INVALID_ROLE',
      name: 'John Doe'
    };

    await expect(User.create(userData)).rejects.toThrow();
  });

  test('should validate gender enum', async () => {
    const userData = {
      phoneNumber: '+1234567890',
      role: 'USER',
      name: 'John Doe',
      gender: 'invalid_gender'
    };

    await expect(User.create(userData)).rejects.toThrow();
  });

  test('should validate age range', async () => {
    const userData = {
      phoneNumber: '+1234567890',
      role: 'USER',
      name: 'John Doe',
      age: 15 // Below minimum age
    };

    await expect(User.create(userData)).rejects.toThrow();
  });
});

describe('Call Model', () => {
  beforeEach(async () => {
    await Call.deleteMany({});
  });

  test('should create a call with valid data', async () => {
    const callData = {
      callerId: new mongoose.Types.ObjectId(),
      receiverId: new mongoose.Types.ObjectId(),
      callType: 'voice',
      streamCallId: 'test_call_123',
      status: 'initiated',
      coinsPerMinute: 49
    };

    const call = await Call.create(callData);
    
    expect(call.callerId).toEqual(callData.callerId);
    expect(call.receiverId).toEqual(callData.receiverId);
    expect(call.callType).toBe(callData.callType);
    expect(call.streamCallId).toBe(callData.streamCallId);
    expect(call.status).toBe(callData.status);
    expect(call.coinsPerMinute).toBe(callData.coinsPerMinute);
    expect(call.isActive).toBe(true);
    expect(call.totalCoinsDeducted).toBe(0);
    expect(call.commissionEarned).toBe(0);
  });

  test('should require callerId', async () => {
    const callData = {
      receiverId: new mongoose.Types.ObjectId(),
      callType: 'voice',
      streamCallId: 'test_call_123'
    };

    await expect(Call.create(callData)).rejects.toThrow();
  });

  test('should require receiverId', async () => {
    const callData = {
      callerId: new mongoose.Types.ObjectId(),
      callType: 'voice',
      streamCallId: 'test_call_123'
    };

    await expect(Call.create(callData)).rejects.toThrow();
  });

  test('should validate callType enum', async () => {
    const callData = {
      callerId: new mongoose.Types.ObjectId(),
      receiverId: new mongoose.Types.ObjectId(),
      callType: 'invalid_type',
      streamCallId: 'test_call_123'
    };

    await expect(Call.create(callData)).rejects.toThrow();
  });

  test('should validate status enum', async () => {
    const callData = {
      callerId: new mongoose.Types.ObjectId(),
      receiverId: new mongoose.Types.ObjectId(),
      callType: 'voice',
      streamCallId: 'test_call_123',
      status: 'invalid_status'
    };

    await expect(Call.create(callData)).rejects.toThrow();
  });
});

describe('Coin Model', () => {
  beforeEach(async () => {
    await Coin.deleteMany({});
  });

  test('should create a coin wallet with valid data', async () => {
    const walletData = {
      userId: new mongoose.Types.ObjectId(),
      balance: 1000,
      totalPurchased: 1000,
      totalSpent: 0,
      totalEarned: 0
    };

    const wallet = await Coin.create(walletData);
    
    expect(wallet.userId).toEqual(walletData.userId);
    expect(wallet.balance).toBe(walletData.balance);
    expect(wallet.totalPurchased).toBe(walletData.totalPurchased);
    expect(wallet.totalSpent).toBe(walletData.totalSpent);
    expect(wallet.totalEarned).toBe(walletData.totalEarned);
  });

  test('should require userId', async () => {
    const walletData = {
      balance: 1000,
      totalPurchased: 1000
    };

    await expect(Coin.create(walletData)).rejects.toThrow();
  });

  test('should default balance to 0', async () => {
    const walletData = {
      userId: new mongoose.Types.ObjectId()
    };

    const wallet = await Coin.create(walletData);
    expect(wallet.balance).toBe(0);
  });
});

describe('Transaction Model', () => {
  beforeEach(async () => {
    await Transaction.deleteMany({});
  });

  test('should create a transaction with valid data', async () => {
    const transactionData = {
      userId: new mongoose.Types.ObjectId(),
      type: 'purchase',
      amount: 100,
      balanceBefore: 0,
      balanceAfter: 100,
      description: 'Test purchase',
      status: 'completed'
    };

    const transaction = await Transaction.create(transactionData);
    
    expect(transaction.userId).toEqual(transactionData.userId);
    expect(transaction.type).toBe(transactionData.type);
    expect(transaction.amount).toBe(transactionData.amount);
    expect(transaction.balanceBefore).toBe(transactionData.balanceBefore);
    expect(transaction.balanceAfter).toBe(transactionData.balanceAfter);
    expect(transaction.description).toBe(transactionData.description);
    expect(transaction.status).toBe(transactionData.status);
  });

  test('should require userId', async () => {
    const transactionData = {
      type: 'purchase',
      amount: 100,
      balanceBefore: 0,
      balanceAfter: 100,
      description: 'Test purchase'
    };

    await expect(Transaction.create(transactionData)).rejects.toThrow();
  });

  test('should require type', async () => {
    const transactionData = {
      userId: new mongoose.Types.ObjectId(),
      amount: 100,
      balanceBefore: 0,
      balanceAfter: 100,
      description: 'Test purchase'
    };

    await expect(Transaction.create(transactionData)).rejects.toThrow();
  });

  test('should validate type enum', async () => {
    const transactionData = {
      userId: new mongoose.Types.ObjectId(),
      type: 'invalid_type',
      amount: 100,
      balanceBefore: 0,
      balanceAfter: 100,
      description: 'Test purchase'
    };

    await expect(Transaction.create(transactionData)).rejects.toThrow();
  });

  test('should validate status enum', async () => {
    const transactionData = {
      userId: new mongoose.Types.ObjectId(),
      type: 'purchase',
      amount: 100,
      balanceBefore: 0,
      balanceAfter: 100,
      description: 'Test purchase',
      status: 'invalid_status'
    };

    await expect(Transaction.create(transactionData)).rejects.toThrow();
  });
});
