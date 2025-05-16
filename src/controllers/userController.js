const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const jwt = require('jsonwebtoken');
const config = require('../config');

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

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, jobTitle, department, phone, preferences } = req.body;
    
    // Fields to update
    const updateFields = {};
    if (name) updateFields.name = name;
    if (jobTitle) updateFields.jobTitle = jobTitle;
    if (department) updateFields.department = department;
    if (phone) updateFields.phone = phone;
    if (preferences) updateFields.preferences = preferences;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateFields },
      { new: true }
    ).select('-password');
    
    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all available users (excluding current user)
exports.getAllUsers = async (req, res) => {
  try {
    // Find all users except the current user
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('name username profilePicture email')
      .sort({ name: 1 });
    
    res.json(users);
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
    
    // Get all projects to check memberships
    const projects = await Project.find().select('name members owner');
    
    // Add project information to each user
    const usersWithProjects = users.map(user => {
      const userObj = user.toObject();
      
      // Find projects where user is a member or owner
      userObj.projects = projects.filter(project => {
        const isOwner = project.owner.toString() === user._id.toString();
        const isMember = project.members.some(memberId => 
          memberId.toString() === user._id.toString()
        );
        return isOwner || isMember;
      }).map(project => ({
        _id: project._id,
        name: project.name,
        role: project.owner.toString() === user._id.toString() ? 'owner' : 'member'
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
    
    // Remove user from all projects where they are a member
    await Project.updateMany(
      { members: userId },
      { $pull: { members: userId } }
    );
    
    // For projects owned by the user, either:
    // 1. Transfer ownership to oldest member
    // 2. Delete the project if no members
    const ownedProjects = await Project.find({ owner: userId });
    
    for (const project of ownedProjects) {
      if (project.members.length > 0) {
        // Get the first member to make them the new owner
        const newOwnerId = project.members[0];
        
        // Update project with new owner and remove them from members
        project.owner = newOwnerId;
        project.members = project.members.filter(
          memberId => memberId.toString() !== newOwnerId.toString()
        );
        
        await project.save();
      } else {
        // No members, delete project and its tasks
        await Task.deleteMany({ project: project._id });
        await project.deleteOne();
      }
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