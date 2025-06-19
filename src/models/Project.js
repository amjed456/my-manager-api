const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['Planning', 'In Progress', 'Completed'],
      default: 'Planning',
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Performance Indexes
projectSchema.index({ owner: 1 }); // Fast queries by owner
projectSchema.index({ members: 1 }); // Fast queries by members
projectSchema.index({ status: 1 }); // Fast queries by status
projectSchema.index({ dueDate: 1 }); // Fast queries by due date
projectSchema.index({ createdAt: -1 }); // Fast queries by creation date (newest first)
projectSchema.index({ owner: 1, status: 1 }); // Compound index for owner + status queries
projectSchema.index({ members: 1, status: 1 }); // Compound index for member + status queries
projectSchema.index({ name: 'text', description: 'text' }); // Text search index

// Calculate project progress based on completed tasks
projectSchema.methods.updateProgress = async function () {
  // You'd implement this when we have a Task model that references projects
  // For now, we'll manually update progress when tasks are completed
};

const Project = mongoose.model('Project', projectSchema);

module.exports = Project; 