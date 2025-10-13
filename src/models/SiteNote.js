const mongoose = require('mongoose');

const siteNoteSchema = new mongoose.Schema(
  {
    apartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Apartment',
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
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
      enum: ['Open', 'In Progress', 'Closed', 'Completed'],
      default: 'Open',
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    images: [{
      url: {
        type: String,
        required: true,
      },
      caption: {
        type: String,
        default: '',
      },
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    category: {
      type: String,
      enum: ['Structural', 'Electrical', 'Plumbing', 'HVAC', 'Finishing', 'Other'],
      default: 'Other',
    },
    startDate: {
      type: Date,
      default: null,
    },
    completionDate: {
      type: Date,
      default: null,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Performance Indexes
siteNoteSchema.index({ apartment: 1 }); // Fast queries by apartment
siteNoteSchema.index({ project: 1 }); // Fast queries by project
siteNoteSchema.index({ author: 1 }); // Fast queries by author
siteNoteSchema.index({ status: 1 }); // Fast queries by status
siteNoteSchema.index({ priority: 1 }); // Fast queries by priority
siteNoteSchema.index({ category: 1 }); // Fast queries by category
siteNoteSchema.index({ apartment: 1, status: 1 }); // Compound index for apartment + status
siteNoteSchema.index({ project: 1, status: 1 }); // Compound index for project + status
siteNoteSchema.index({ createdAt: -1 }); // Fast queries by creation date (newest first)

const SiteNote = mongoose.model('SiteNote', siteNoteSchema);

module.exports = SiteNote; 