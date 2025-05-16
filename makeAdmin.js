/**
 * Utility script to make a user an admin
 * 
 * Usage: node makeAdmin.js <username>
 */

const mongoose = require('mongoose');
const User = require('./src/models/User');
const config = require('./src/config');

// Validate arguments
if (process.argv.length < 3) {
  console.error('Please provide a username');
  console.error('Usage: node makeAdmin.js <username>');
  process.exit(1);
}

const username = process.argv[2];

// Connect to MongoDB
mongoose.connect(config.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    makeUserAdmin(username);
  })
  .catch(error => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

async function makeUserAdmin(username) {
  try {
    // Find user by username
    const user = await User.findOne({ username });
    
    if (!user) {
      console.error(`User "${username}" not found`);
      process.exit(1);
    }
    
    // Check if user is already an admin
    if (user.role === 'admin') {
      console.log(`User "${username}" is already an admin`);
      process.exit(0);
    }
    
    // Update user role to admin
    user.role = 'admin';
    await user.save();
    
    console.log(`Successfully made "${username}" an admin`);
    process.exit(0);
  } catch (error) {
    console.error('Error making user admin:', error);
    process.exit(1);
  } finally {
    mongoose.disconnect();
  }
} 