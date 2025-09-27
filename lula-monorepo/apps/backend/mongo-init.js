// MongoDB initialization script for Docker
db = db.getSiblingDB('lula');

// Create collections with proper indexes
db.createCollection('users');
db.createCollection('calls');
db.createCollection('transactions');
db.createCollection('coins');
db.createCollection('chats');
db.createCollection('messages');
db.createCollection('notifications');

// Create indexes for better performance
db.users.createIndex({ "phoneNumber": 1 }, { unique: true });
db.users.createIndex({ "role": 1 });
db.users.createIndex({ "isOnline": 1 });

db.calls.createIndex({ "callerId": 1 });
db.calls.createIndex({ "receiverId": 1 });
db.calls.createIndex({ "status": 1 });
db.calls.createIndex({ "startTime": -1 });
db.calls.createIndex({ "streamCallId": 1 });
db.calls.createIndex({ "streamChannelId": 1 });

db.transactions.createIndex({ "userId": 1 });
db.transactions.createIndex({ "type": 1 });
db.transactions.createIndex({ "createdAt": -1 });

db.coins.createIndex({ "userId": 1 }, { unique: true });

db.chats.createIndex({ "participants.userId": 1 });
db.chats.createIndex({ "lastMessageAt": -1 });
db.chats.createIndex({ "createdAt": -1 });

db.messages.createIndex({ "chatId": 1, "createdAt": -1 });
db.messages.createIndex({ "senderId": 1 });
db.messages.createIndex({ "flags.isDeleted": 1 });
db.messages.createIndex({ "flags.isReported": 1 });

db.notifications.createIndex({ "recipientId": 1 });
db.notifications.createIndex({ "type": 1 });
db.notifications.createIndex({ "status": 1 });
db.notifications.createIndex({ "createdAt": -1 });
db.notifications.createIndex({ "expiresAt": 1 });

print('✅ MongoDB initialization completed successfully!');
print('📊 Created collections: users, calls, transactions, coins, chats, messages, notifications');
print('🔍 Created indexes for optimal performance');
