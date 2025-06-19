const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    name: {
      type: String,
      required: true,
    },
    jobTitle: {
      type: String,
      default: '',
    },
    department: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
    profilePicture: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    preferences: {
      darkMode: {
        type: Boolean,
        default: false,
      },
      notifications: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Performance Indexes (username and email already have unique indexes)
userSchema.index({ role: 1 }); // Fast queries by role
userSchema.index({ department: 1 }); // Fast queries by department
userSchema.index({ createdAt: -1 }); // Fast queries by creation date
userSchema.index({ name: 'text', username: 'text' }); // Text search index for user search

// Hash password before saving
userSchema.pre('save', async function (next) {
  const user = this;
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 10);
  }
  next();
});

// Method to check password validity
userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User; 