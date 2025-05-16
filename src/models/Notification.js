const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['TASK_COMPLETED', 'PROJECT_PROGRESS', 'TEAM_MEMBER_ADDED', 'PROJECT_CREATED', 'PROJECT_STATUS_CHANGED'],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
    },
    progress: {
      type: Number, // For project progress updates
      min: 0,
      max: 100,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true, // The user who triggered the notification
    },
    recipients: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Add index for better query performance
notificationSchema.index({ recipients: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification; 