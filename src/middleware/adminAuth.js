const User = require('../models/User');

// Admin authentication middleware
module.exports = async (req, res, next) => {
  try {
    // Check if user exists in the request (from the auth middleware)
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Check if user has admin role
    const user = await User.findById(req.user._id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 