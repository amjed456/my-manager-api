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
    },
    workDescription: {
      type: String,
      required: true,
    },
    hoursWorked: {
      type: Number,
      required: true,
      min: 0,
    },
    photos: [{
      type: String,
    }],
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