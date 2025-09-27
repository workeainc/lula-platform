const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../src/app');
const User = require('../src/models/User');
const Coin = require('../src/models/Coin');
const Call = require('../src/models/Call');
const Transaction = require('../src/models/Transaction');

describe('Auth Routes', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await Coin.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    test('should register a new user', async () => {
      const userData = {
        phoneNumber: '+1234567890',
        role: 'USER',
        name: 'John Doe'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.error).toBe(false);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.phoneNumber).toBe(userData.phoneNumber);
      expect(response.body.user.role).toBe(userData.role);
      expect(response.body.token).toBeDefined();
    });

    test('should not register user with duplicate phone number', async () => {
      const userData = {
        phoneNumber: '+1234567890',
        role: 'USER',
        name: 'John Doe'
      };

      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Second registration with same phone number
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBe(true);
      expect(response.body.message).toContain('already exists');
    });

    test('should not register user without required fields', async () => {
      const userData = {
        name: 'John Doe'
        // Missing phoneNumber and role
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBe(true);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      const user = await User.create({
        phoneNumber: '+1234567890',
        role: 'USER',
        name: 'John Doe'
      });

      await Coin.create({
        userId: user._id,
        balance: 1000
      });
    });

    test('should login with valid credentials', async () => {
      const loginData = {
        phoneNumber: '+1234567890'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.error).toBe(false);
      expect(response.body.user).toBeDefined();
      expect(response.body.token).toBeDefined();
    });

    test('should not login with invalid phone number', async () => {
      const loginData = {
        phoneNumber: '+9999999999'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(404);

      expect(response.body.error).toBe(true);
      expect(response.body.message).toContain('not found');
    });
  });
});

describe('User Routes', () => {
  let authToken;
  let testUser;

  beforeEach(async () => {
    await User.deleteMany({});
    await Coin.deleteMany({});

    // Create test user
    testUser = await User.create({
      phoneNumber: '+1234567890',
      role: 'USER',
      name: 'John Doe'
    });

    await Coin.create({
      userId: testUser._id,
      balance: 1000
    });

    // Get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ phoneNumber: '+1234567890' });

    authToken = loginResponse.body.token;
  });

  describe('GET /api/user/profile', () => {
    test('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.error).toBe(false);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.phoneNumber).toBe('+1234567890');
    });

    test('should not get profile without token', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .expect(401);

      expect(response.body.error).toBe(true);
    });
  });

  describe('PUT /api/user/profile', () => {
    test('should update user profile', async () => {
      const updateData = {
        name: 'Jane Doe',
        bio: 'Updated bio'
      };

      const response = await request(app)
        .put('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.error).toBe(false);
      expect(response.body.user.name).toBe(updateData.name);
      expect(response.body.user.bio).toBe(updateData.bio);
    });
  });
});

describe('Call Routes', () => {
  let authToken;
  let caller;
  let streamer;
  let callerWallet;
  let streamerWallet;

  beforeEach(async () => {
    await User.deleteMany({});
    await Coin.deleteMany({});
    await Call.deleteMany({});

    // Create caller
    caller = await User.create({
      phoneNumber: '+1234567890',
      role: 'USER',
      name: 'Caller User',
      isOnline: true
    });

    // Create streamer
    streamer = await User.create({
      phoneNumber: '+0987654321',
      role: 'STREAMER',
      name: 'Streamer User',
      isOnline: true
    });

    // Create wallets
    callerWallet = await Coin.create({
      userId: caller._id,
      balance: 1000
    });

    streamerWallet = await Coin.create({
      userId: streamer._id,
      balance: 0
    });

    // Get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ phoneNumber: '+1234567890' });

    authToken = loginResponse.body.token;
  });

  describe('POST /api/call/initiate', () => {
    test('should initiate a call with sufficient balance', async () => {
      const callData = {
        callerId: caller._id,
        receiverId: streamer._id,
        callType: 'voice'
      };

      const response = await request(app)
        .post('/api/call/initiate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(callData)
        .expect(201);

      expect(response.body.error).toBe(false);
      expect(response.body.call).toBeDefined();
      expect(response.body.call.callerId).toBe(caller._id.toString());
      expect(response.body.call.receiverId).toBe(streamer._id.toString());
    });

    test('should not initiate call with insufficient balance', async () => {
      // Update caller wallet to have insufficient balance
      await Coin.findByIdAndUpdate(callerWallet._id, { balance: 10 });

      const callData = {
        callerId: caller._id,
        receiverId: streamer._id,
        callType: 'voice'
      };

      const response = await request(app)
        .post('/api/call/initiate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(callData)
        .expect(400);

      expect(response.body.error).toBe(true);
      expect(response.body.message).toContain('Insufficient balance');
    });

    test('should not initiate call to offline user', async () => {
      // Set streamer offline
      await User.findByIdAndUpdate(streamer._id, { isOnline: false });

      const callData = {
        callerId: caller._id,
        receiverId: streamer._id,
        callType: 'voice'
      };

      const response = await request(app)
        .post('/api/call/initiate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(callData)
        .expect(400);

      expect(response.body.error).toBe(true);
      expect(response.body.message).toContain('not available');
    });
  });

  describe('POST /api/call/accept', () => {
    let testCall;

    beforeEach(async () => {
      // Create a test call
      testCall = await Call.create({
        callerId: caller._id,
        receiverId: streamer._id,
        callType: 'voice',
        streamCallId: 'test_call_123',
        status: 'initiated'
      });
    });

    test('should accept a call', async () => {
      const acceptData = {
        callId: testCall._id,
        receiverId: streamer._id
      };

      const response = await request(app)
        .post('/api/call/accept')
        .set('Authorization', `Bearer ${authToken}`)
        .send(acceptData)
        .expect(200);

      expect(response.body.error).toBe(false);
      expect(response.body.message).toContain('accepted');
    });
  });
});

describe('Coin Routes', () => {
  let authToken;
  let testUser;
  let testWallet;

  beforeEach(async () => {
    await User.deleteMany({});
    await Coin.deleteMany({});

    // Create test user
    testUser = await User.create({
      phoneNumber: '+1234567890',
      role: 'USER',
      name: 'Test User'
    });

    testWallet = await Coin.create({
      userId: testUser._id,
      balance: 1000
    });

    // Get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ phoneNumber: '+1234567890' });

    authToken = loginResponse.body.token;
  });

  describe('GET /api/coin/balance', () => {
    test('should get coin balance', async () => {
      const response = await request(app)
        .get('/api/coin/balance')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.error).toBe(false);
      expect(response.body.balance).toBe(1000);
    });
  });

  describe('POST /api/coin/purchase', () => {
    test('should purchase coins', async () => {
      const purchaseData = {
        amount: 500,
        paymentMethod: 'card'
      };

      const response = await request(app)
        .post('/api/coin/purchase')
        .set('Authorization', `Bearer ${authToken}`)
        .send(purchaseData)
        .expect(200);

      expect(response.body.error).toBe(false);
      expect(response.body.newBalance).toBe(1500);
    });
  });

  describe('POST /api/coin/deduct', () => {
    test('should deduct coins', async () => {
      const deductData = {
        amount: 100,
        description: 'Test deduction'
      };

      const response = await request(app)
        .post('/api/coin/deduct')
        .set('Authorization', `Bearer ${authToken}`)
        .send(deductData)
        .expect(200);

      expect(response.body.error).toBe(false);
      expect(response.body.balance).toBe(900);
    });

    test('should not deduct more than available balance', async () => {
      const deductData = {
        amount: 1500,
        description: 'Test deduction'
      };

      const response = await request(app)
        .post('/api/coin/deduct')
        .set('Authorization', `Bearer ${authToken}`)
        .send(deductData)
        .expect(400);

      expect(response.body.error).toBe(true);
      expect(response.body.message).toContain('Insufficient balance');
    });
  });
});

describe('Health Check', () => {
  test('should return health status', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body.status).toBe('OK');
    expect(response.body.timestamp).toBeDefined();
  });
});
