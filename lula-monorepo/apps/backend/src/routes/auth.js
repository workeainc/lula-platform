const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Coin = require('../models/Coin');
const MSG91Service = require('../services/MSG91Service');
const router = express.Router();

// Register/Login with OTP
router.post('/register', async (req, res) => {
  try {
    const { phoneNumber, role = 'USER' } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({
        error: true,
        message: 'Phone number is required'
      });
    }
    
    // Check if user already exists (regardless of role, since phoneNumber is unique)
    console.log(`🔍 Checking for existing user with phone: ${phoneNumber}`);
    let user = await User.findOne({ 
      phoneNumber,
      isDeleted: false 
    });
    console.log(`🔍 Found existing user:`, user ? `Yes (ID: ${user._id}, Role: ${user.role})` : 'No');
    
    if (user) {
      // User exists, update role if different and update last login
      const previousRole = user.role;
      if (user.role !== role) {
        user.role = role;
        console.log(`🔄 Updated user role from ${previousRole} to ${role} for phone: ${phoneNumber}`);
      }
      
      user.lastLoginAt = new Date();
      user.isOnline = true;
      await user.save();
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
      );
      
      return res.json({
        error: false,
        message: previousRole !== role ? 'Role updated and login successful' : 'Login successful',
        user: {
          id: user._id,
          phoneNumber: user.phoneNumber,
          role: user.role,
          name: user.name,
          profileImage: user.profileImage,
          isOnline: user.isOnline
        },
        token
      });
    }
    
    // Create new user
    user = new User({
      phoneNumber,
      role,
      isOnline: true
    });
    
    await user.save();
    
    // Create coin wallet for new user
    const coinWallet = new Coin({
      userId: user._id,
      balance: 0
    });
    await coinWallet.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );
    
    res.status(201).json({
      error: false,
      message: 'User registered successfully',
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        role: user.role,
        name: user.name,
        profileImage: user.profileImage,
        isOnline: user.isOnline
      },
      token
    });
    
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      error: true,
      message: 'Registration failed'
    });
  }
});

// Send OTP for phone verification
router.post('/send-otp', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({
        error: true,
        message: 'Phone number is required'
      });
    }
    
    // Generate OTP
    const otp = MSG91Service.generateOTP();
    console.log('📱 Generated OTP for', phoneNumber, ':', otp);
    
    // Send OTP via MSG91
    const otpResult = await MSG91Service.sendOTP(phoneNumber, otp);
    
    if (otpResult.error) {
      return res.status(500).json({
        error: true,
        message: 'Failed to send OTP',
        details: otpResult.details
      });
    }
    
    // In production, store OTP in Redis with expiration
    // For now, we'll use a simple in-memory store
    global.otpStore = global.otpStore || {};
    global.otpStore[phoneNumber] = {
      otp: otp,
      expiry: Date.now() + (5 * 60 * 1000) // 5 minutes
    };
    
    res.json({
      error: false,
      message: 'OTP sent successfully',
      requestId: otpResult.requestId,
      // For development only - remove in production
      ...(process.env.NODE_ENV === 'development' && { devOtp: otp })
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to send OTP'
    });
  }
});

// Verify OTP - Updated to use MSG91
router.post('/verify-otp', async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;
    
    if (!phoneNumber || !otp) {
      return res.status(400).json({
        error: true,
        message: 'Phone number and OTP are required'
      });
    }
    
    // Get stored OTP
    global.otpStore = global.otpStore || {};
    const storedOtpData = global.otpStore[phoneNumber];
    
    if (!storedOtpData) {
      return res.status(400).json({
        error: true,
        message: 'No OTP found for this phone number. Please request a new OTP.'
      });
    }
    
    // Check if OTP has expired
    if (Date.now() > storedOtpData.expiry) {
      delete global.otpStore[phoneNumber];
      return res.status(400).json({
        error: true,
        message: 'OTP has expired. Please request a new OTP.'
      });
    }
    
    // Verify OTP using MSG91Service
    const verificationResult = await MSG91Service.verifyOTP(phoneNumber, otp, storedOtpData.otp);
    
    if (verificationResult.error) {
      return res.status(400).json({
        error: true,
        message: verificationResult.message
      });
    }
    
    // OTP verified successfully, clean up
    delete global.otpStore[phoneNumber];
    
    res.json({
      error: false,
      message: 'OTP verified successfully'
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      error: true,
      message: 'OTP verification failed'
    });
  }
});

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        error: true,
        message: 'User ID is required'
      });
    }
    
    const user = await User.findById(userId).select('-__v');
    
    if (!user || user.isDeleted) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }
    
    res.json({
      error: false,
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        role: user.role,
        name: user.name,
        age: user.age,
        gender: user.gender,
        bio: user.bio,
        profileImage: user.profileImage,
        profileVideo: user.profileVideo,
        images: user.images,
        videos: user.videos,
        location: user.location,
        followers: user.followers,
        following: user.following,
        isOnline: user.isOnline,
        statusShow: user.statusShow,
        isVerified: user.isVerified,
        createdAt: user.createdAt
      }
    });
    
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to get user profile'
    });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  try {
    const { userId, ...updateData } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        error: true,
        message: 'User ID is required'
      });
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-__v');
    
    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }
    
    res.json({
      error: false,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        role: user.role,
        name: user.name,
        age: user.age,
        gender: user.gender,
        bio: user.bio,
        profileImage: user.profileImage,
        profileVideo: user.profileVideo,
        images: user.images,
        videos: user.videos,
        location: user.location,
        isOnline: user.isOnline,
        statusShow: user.statusShow,
        isVerified: user.isVerified
      }
    });
    
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to update profile'
    });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (userId) {
      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        lastLoginAt: new Date()
      });
    }
    
    res.json({
      error: false,
      message: 'Logged out successfully'
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: true,
      message: 'Logout failed'
    });
  }
});

module.exports = router;
