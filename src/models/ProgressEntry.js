const mongoose = require('mongoose');

const progressEntrySchema = new mongoose.Schema(
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
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    summary: {
      type: String,
      required: true,
    },
    workPoints: [{
      type: String,
      required: true,
    }],
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
    hoursWorked: {
      type: Number,
      min: 0,
      default: 0,
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
progressEntrySchema.index({ apartment: 1 }); // Fast queries by apartment
progressEntrySchema.index({ project: 1 }); // Fast queries by project
progressEntrySchema.index({ author: 1 }); // Fast queries by author
progressEntrySchema.index({ date: -1 }); // Fast queries by date (newest first)
progressEntrySchema.index({ apartment: 1, date: -1 }); // Compound index for apartment + date
progressEntrySchema.index({ project: 1, date: -1 }); // Compound index for project + date

const ProgressEntry = mongoose.model('ProgressEntry', progressEntrySchema);

module.exports = ProgressEntry; 