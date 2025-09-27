const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Chat = require('../src/models/Chat');
const Message = require('../src/models/Message');
const ChatService = require('../src/services/ChatService');
const mongoose = require('mongoose');
require('dotenv').config();

describe('Chat System Integration Tests', () => {
  let testUser1, testUser2;
  let authToken1, authToken2;
  let testChat;

  beforeAll(async () => {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lula', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Create test users
    testUser1 = new User({
      name: 'Test User',
      phoneNumber: '+1234567890',
      role: 'USER',
      isOnline: true
    });
    await testUser1.save();

    testUser2 = new User({
      name: 'Test Streamer',
      phoneNumber: '+1234567891',
      role: 'STREAMER',
      isOnline: true
    });
    await testUser2.save();

    // Generate auth tokens (simplified for testing)
    authToken1 = 'test-token-1';
    authToken2 = 'test-token-2';
  });

  afterAll(async () => {
    // Cleanup
    await User.deleteMany({ phoneNumber: { $in: ['+1234567890', '+1234567891'] } });
    await Chat.deleteMany({});
    await Message.deleteMany({});
    await mongoose.disconnect();
  });

  describe('Chat Creation', () => {
    test('Should create a new chat between user and streamer', async () => {
      const response = await request(app)
        .post('/api/chat/create')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          streamerId: testUser2._id.toString()
        });

      expect(response.status).toBe(200);
      expect(response.body.error).toBe(false);
      expect(response.body.chat).toBeDefined();
      expect(response.body.chat.participants).toHaveLength(2);
      expect(response.body.isNew).toBe(true);

      testChat = response.body.chat;
    });

    test('Should return existing chat if already exists', async () => {
      const response = await request(app)
        .post('/api/chat/create')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          streamerId: testUser2._id.toString()
        });

      expect(response.status).toBe(200);
      expect(response.body.error).toBe(false);
      expect(response.body.isNew).toBe(false);
    });

    test('Should reject invalid streamer ID', async () => {
      const response = await request(app)
        .post('/api/chat/create')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          streamerId: 'invalid-id'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(true);
    });
  });

  describe('Message Sending', () => {
    test('Should send a text message', async () => {
      const response = await request(app)
        .post(`/api/chat/${testChat._id}/message`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          content: 'Hello, this is a test message!',
          messageType: 'text'
        });

      expect(response.status).toBe(200);
      expect(response.body.error).toBe(false);
      expect(response.body.messageData).toBeDefined();
      expect(response.body.messageData.content).toBe('Hello, this is a test message!');
    });

    test('Should send a message with attachments', async () => {
      const response = await request(app)
        .post(`/api/chat/${testChat._id}/message`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({
          content: 'Here is an image',
          messageType: 'image',
          attachments: [{
            type: 'image',
            url: 'https://example.com/image.jpg',
            filename: 'test-image.jpg',
            size: 1024000
          }]
        });

      expect(response.status).toBe(200);
      expect(response.body.error).toBe(false);
      expect(response.body.messageData.attachments).toHaveLength(1);
    });

    test('Should reject empty message', async () => {
      const response = await request(app)
        .post(`/api/chat/${testChat._id}/message`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          content: '',
          messageType: 'text'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(true);
    });
  });

  describe('Message Retrieval', () => {
    test('Should get chat messages with pagination', async () => {
      const response = await request(app)
        .get(`/api/chat/${testChat._id}/messages`)
        .set('Authorization', `Bearer ${authToken1}`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.error).toBe(false);
      expect(response.body.messages).toBeDefined();
      expect(response.body.pagination).toBeDefined();
      expect(response.body.messages.length).toBeGreaterThan(0);
    });

    test('Should mark messages as read', async () => {
      const response = await request(app)
        .put(`/api/chat/${testChat._id}/messages/read`)
        .set('Authorization', `Bearer ${authToken2}`);

      expect(response.status).toBe(200);
      expect(response.body.error).toBe(false);
    });
  });

  describe('Chat List', () => {
    test('Should get user chat list', async () => {
      const response = await request(app)
        .get('/api/chat/list')
        .set('Authorization', `Bearer ${authToken1}`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.error).toBe(false);
      expect(response.body.chats).toBeDefined();
      expect(response.body.chats.length).toBeGreaterThan(0);
    });

    test('Should get chat list filtered by role', async () => {
      const response = await request(app)
        .get('/api/chat/list')
        .set('Authorization', `Bearer ${authToken1}`)
        .query({ role: 'STREAMER', page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.error).toBe(false);
      expect(response.body.chats).toBeDefined();
    });
  });

  describe('Chat Management', () => {
    test('Should get chat by ID', async () => {
      const response = await request(app)
        .get(`/api/chat/${testChat._id}`)
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.error).toBe(false);
      expect(response.body.chat).toBeDefined();
      expect(response.body.chat._id).toBe(testChat._id);
    });

    test('Should get chat statistics', async () => {
      const response = await request(app)
        .get(`/api/chat/${testChat._id}/stats`)
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.error).toBe(false);
      expect(response.body.stats).toBeDefined();
      expect(response.body.stats.totalMessages).toBeGreaterThan(0);
    });

    test('Should delete chat', async () => {
      const response = await request(app)
        .delete(`/api/chat/${testChat._id}`)
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.error).toBe(false);
    });
  });

  describe('Message Actions', () => {
    let testMessage;

    beforeAll(async () => {
      // Create a new chat for message actions testing
      const chatResponse = await request(app)
        .post('/api/chat/create')
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          streamerId: testUser2._id.toString()
        });

      testChat = chatResponse.body.chat;

      // Send a message
      const messageResponse = await request(app)
        .post(`/api/chat/${testChat._id}/message`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          content: 'Test message for actions',
          messageType: 'text'
        });

      testMessage = messageResponse.body.messageData;
    });

    test('Should edit a message', async () => {
      const response = await request(app)
        .put(`/api/chat/message/${testMessage._id}/edit`)
        .set('Authorization', `Bearer ${authToken1}`)
        .send({
          content: 'Edited message content'
        });

      expect(response.status).toBe(200);
      expect(response.body.error).toBe(false);
    });

    test('Should add reaction to message', async () => {
      const response = await request(app)
        .post(`/api/chat/message/${testMessage._id}/reaction`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({
          emoji: '👍'
        });

      expect(response.status).toBe(200);
      expect(response.body.error).toBe(false);
    });

    test('Should remove reaction from message', async () => {
      const response = await request(app)
        .delete(`/api/chat/message/${testMessage._id}/reaction`)
        .set('Authorization', `Bearer ${authToken2}`);

      expect(response.status).toBe(200);
      expect(response.body.error).toBe(false);
    });

    test('Should delete a message', async () => {
      const response = await request(app)
        .delete(`/api/chat/message/${testMessage._id}`)
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(200);
      expect(response.body.error).toBe(false);
    });
  });

  describe('Chat Service Integration', () => {
    test('Should create chat using ChatService', async () => {
      const chatService = new ChatService();
      const result = await chatService.createChat(
        testUser1._id.toString(),
        testUser2._id.toString()
      );

      expect(result.error).toBe(false);
      expect(result.chat).toBeDefined();
    });

    test('Should send message using ChatService', async () => {
      const chatService = new ChatService();
      const result = await chatService.sendMessage(
        testChat._id.toString(),
        testUser1._id.toString(),
        {
          content: 'Service test message',
          messageType: 'text'
        }
      );

      expect(result.error).toBe(false);
      expect(result.message).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('Should handle unauthorized access', async () => {
      const response = await request(app)
        .post('/api/chat/create')
        .send({
          streamerId: testUser2._id.toString()
        });

      expect(response.status).toBe(401);
    });

    test('Should handle invalid chat ID', async () => {
      const response = await request(app)
        .get('/api/chat/invalid-id')
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(true);
    });

    test('Should handle non-participant access', async () => {
      // Create a chat between two other users
      const otherUser1 = new User({
        name: 'Other User 1',
        phoneNumber: '+1234567892',
        role: 'USER'
      });
      await otherUser1.save();

      const otherUser2 = new User({
        name: 'Other Streamer 1',
        phoneNumber: '+1234567893',
        role: 'STREAMER'
      });
      await otherUser2.save();

      const chat = new Chat({
        participants: [
          { userId: otherUser1._id, role: 'USER' },
          { userId: otherUser2._id, role: 'STREAMER' }
        ],
        createdBy: otherUser1._id
      });
      await chat.save();

      const response = await request(app)
        .get(`/api/chat/${chat._id}`)
        .set('Authorization', `Bearer ${authToken1}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBe(true);

      // Cleanup
      await User.deleteMany({ phoneNumber: { $in: ['+1234567892', '+1234567893'] } });
      await Chat.deleteOne({ _id: chat._id });
    });
  });
});
