const mongoose = require('mongoose');

const apartmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    number: {
      type: Number,
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Completed'],
      default: 'Not Started',
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    description: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Performance Indexes
apartmentSchema.index({ project: 1 }); // Fast queries by project
apartmentSchema.index({ project: 1, number: 1 }); // Compound index for project + apartment number
apartmentSchema.index({ status: 1 }); // Fast queries by status

const Apartment = mongoose.model('Apartment', apartmentSchema);

module.exports = Apartment; 