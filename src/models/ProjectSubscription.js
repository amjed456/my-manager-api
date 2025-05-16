const mongoose = require('mongoose');

const projectSubscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    isSubscribed: {
      type: Boolean,
      default: true,
    }
  },
  {
    timestamps: true,
  }
);

// Create a compound index to ensure unique user-project combinations
projectSubscriptionSchema.index({ user: 1, project: 1 }, { unique: true });

const ProjectSubscription = mongoose.model('ProjectSubscription', projectSubscriptionSchema);

module.exports = ProjectSubscription; 