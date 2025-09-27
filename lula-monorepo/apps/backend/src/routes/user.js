const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Get user profile
router.get('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
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
    console.error('Get user profile error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to get user profile'
    });
  }
});

// Update user profile
router.put('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;
    
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
    console.error('Update user profile error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to update profile'
    });
  }
});

// Get users by role
router.get('/role/:role', async (req, res) => {
  try {
    const { role } = req.params;
    const { page = 1, limit = 20, online = false } = req.query;
    
    let query = { role, isDeleted: false };
    
    if (online === 'true') {
      query.isOnline = true;
    }
    
    const users = await User.find(query)
      .select('-__v')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ lastLoginAt: -1 });
    
    const total = await User.countDocuments(query);
    
    res.json({
      error: false,
      users: users.map(user => ({
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
        isVerified: user.isVerified,
        createdAt: user.createdAt
      })),
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
    
  } catch (error) {
    console.error('Get users by role error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to get users'
    });
  }
});

// Search users
router.get('/search', async (req, res) => {
  try {
    const { q, role, page = 1, limit = 20 } = req.query;
    
    if (!q) {
      return res.status(400).json({
        error: true,
        message: 'Search query is required'
      });
    }
    
    let query = {
      isDeleted: false,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { phoneNumber: { $regex: q, $options: 'i' } },
        { bio: { $regex: q, $options: 'i' } }
      ]
    };
    
    if (role) {
      query.role = role;
    }
    
    const users = await User.find(query)
      .select('-__v')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ lastLoginAt: -1 });
    
    const total = await User.countDocuments(query);
    
    res.json({
      error: false,
      users: users.map(user => ({
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
        isVerified: user.isVerified,
        createdAt: user.createdAt
      })),
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
    
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to search users'
    });
  }
});

// Follow/Unfollow user
router.post('/follow', async (req, res) => {
  try {
    const { userId, targetUserId } = req.body;
    
    if (userId === targetUserId) {
      return res.status(400).json({
        error: true,
        message: 'Cannot follow yourself'
      });
    }
    
    const user = await User.findById(userId);
    const targetUser = await User.findById(targetUserId);
    
    if (!user || !targetUser) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }
    
    const isFollowing = user.following.includes(targetUserId);
    
    if (isFollowing) {
      // Unfollow
      await User.findByIdAndUpdate(userId, {
        $pull: { following: targetUserId }
      });
      await User.findByIdAndUpdate(targetUserId, {
        $pull: { followers: userId }
      });
      
      res.json({
        error: false,
        message: 'Unfollowed successfully',
        isFollowing: false
      });
    } else {
      // Follow
      await User.findByIdAndUpdate(userId, {
        $addToSet: { following: targetUserId }
      });
      await User.findByIdAndUpdate(targetUserId, {
        $addToSet: { followers: userId }
      });
      
      res.json({
        error: false,
        message: 'Followed successfully',
        isFollowing: true
      });
    }
    
  } catch (error) {
    console.error('Follow/Unfollow error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to follow/unfollow user'
    });
  }
});

// Get followers
router.get('/followers/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const user = await User.findById(userId)
      .populate('followers', 'name profileImage isOnline')
      .select('followers');
    
    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }
    
    const followers = user.followers.slice((page - 1) * limit, page * limit);
    
    res.json({
      error: false,
      followers: followers.map(follower => ({
        id: follower._id,
        name: follower.name,
        profileImage: follower.profileImage,
        isOnline: follower.isOnline
      })),
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(user.followers.length / limit),
        total: user.followers.length
      }
    });
    
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to get followers'
    });
  }
});

// Get following
router.get('/following/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const user = await User.findById(userId)
      .populate('following', 'name profileImage isOnline')
      .select('following');
    
    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }
    
    const following = user.following.slice((page - 1) * limit, page * limit);
    
    res.json({
      error: false,
      following: following.map(followingUser => ({
        id: followingUser._id,
        name: followingUser.name,
        profileImage: followingUser.profileImage,
        isOnline: followingUser.isOnline
      })),
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(user.following.length / limit),
        total: user.following.length
      }
    });
    
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to get following'
    });
  }
});

module.exports = router;
