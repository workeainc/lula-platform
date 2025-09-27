// User types
export interface User {
  id: string;
  email: string;
  phone: string;
  name?: string;
  avatar?: string;
  isVerified: boolean;
  role: 'user' | 'streamer' | 'admin';
  coins: number;
  createdAt: Date;
  updatedAt: Date;
}

// Call types
export interface Call {
  id: string;
  callerId: string;
  receiverId: string;
  status: 'pending' | 'active' | 'ended' | 'rejected';
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  cost?: number;
}

// Chat types
export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: Message;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'audio';
  timestamp: Date;
}

// Transaction types
export interface Transaction {
  id: string;
  userId: string;
  type: 'purchase' | 'earn' | 'spend';
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Authentication types
export interface LoginRequest {
  phone: string;
  otp?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// Common enums
export enum UserRole {
  USER = 'user',
  STREAMER = 'streamer',
  ADMIN = 'admin'
}

export enum CallStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  ENDED = 'ended',
  REJECTED = 'rejected'
}
