const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { cache, CacheKeys, CacheInvalidation } = require('../utils/cache');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    config.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

// Register a new user
exports.register = async (req, res) => {
  try {
    const { username, email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      name,
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Return user data (without password) and token
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id);

    // Return user data and token
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user profile (with caching)
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const cacheKey = CacheKeys.user(userId);
    
    // Try to get from cache first
    let user = cache.get(cacheKey);
    
    if (!user) {
      // Not in cache, fetch from database
      user = await User.findById(userId).select('-password').lean();
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Cache the user for 10 minutes
      cache.set(cacheKey, user, 10 * 60 * 1000);
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update user profile (with cache invalidation)
exports.updateProfile = async (req, res) => {
  try {
    const { name, jobTitle, department, phone, preferences } = req.body;
    const userId = req.user._id;
    
    // Fields to update
    const updateFields = {};
    if (name) updateFields.name = name;
    if (jobTitle) updateFields.jobTitle = jobTitle;
    if (department) updateFields.department = department;
    if (phone) updateFields.phone = phone;
    if (preferences) updateFields.preferences = preferences;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true }
    ).select('-password').lean();
    
    // Invalidate user cache
    CacheInvalidation.invalidateUser(userId);
    
    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all available users (excluding current user) - with caching
exports.getAllUsers = async (req, res) => {
  try {
    const cacheKey = CacheKeys.availableUsers();
    
    // Try to get from cache first
    let users = cache.get(cacheKey);
    
    if (!users) {
      // Not in cache, fetch from database
      users = await User.find({ _id: { $ne: req.user._id } })
        .select('name username profilePicture email')
        .lean()
        .sort({ name: 1 });
      
      // Cache the results for 5 minutes
      cache.set(cacheKey, users, 5 * 60 * 1000);
    }
    
    // Filter out current user from cached results (in case cache was set by different user)
    const filteredUsers = users.filter(user => user._id.toString() !== req.user._id.toString());
    
    res.json(filteredUsers);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ADMIN ENDPOINTS

// Get all users with their project memberships - Admin only
exports.adminGetAllUsers = async (req, res) => {
  try {
    // Get all users
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });
    
    // Get all projects to check ownership
    const projects = await Project.find().select('name owner');
    
    // Add project information to each user
    const usersWithProjects = users.map(user => {
      const userObj = user.toObject();
      
      // Find projects where user is the owner
      userObj.projects = projects.filter(project => {
        const isOwner = project.owner.toString() === user._id.toString();
        return isOwner;
      }).map(project => ({
        _id: project._id,
        name: project.name,
        role: 'owner'
      }));
      
      return userObj;
    });
    
    res.json(usersWithProjects);
  } catch (error) {
    console.error('Admin get all users error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a user - Admin only
exports.adminDeleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Don't allow admin to delete themselves
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }
    
    // Find user to delete
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // For projects owned by the user, delete them and their associated data
    const ownedProjects = await Project.find({ owner: userId });
    
    for (const project of ownedProjects) {
      // Delete all tasks associated with this project
      await Task.deleteMany({ project: project._id });
      
      // Delete the project
      await project.deleteOne();
    }
    
    // Delete the user
    await user.deleteOne();
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Admin delete user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Check if user has admin privileges
exports.checkAdminStatus = async (req, res) => {
  try {
    const user = req.user;
    const isAdmin = user.role === 'admin';
    
    res.json({ isAdmin });
  } catch (error) {
    console.error('Check admin status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 