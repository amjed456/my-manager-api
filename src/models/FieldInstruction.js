const mongoose = require('mongoose');

const fieldInstructionSchema = new mongoose.Schema(
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
      enum: ['Created', 'Work Started', 'Completed'],
      default: 'Created',
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
      enum: ['Safety', 'Quality', 'Schedule', 'Technical', 'Other'],
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
      type: String,
      default: null,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    instructions: {
      type: String,
      default: '',
    },
    steps: [{
      id: String,
      description: String,
      order: Number,
      completed: {
        type: Boolean,
        default: false
      },
      completedAt: {
        type: Date,
        default: null
      },
      completedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
      }
    }],
    attachments: [{
      url: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    }],
  },
  {
    timestamps: true,
  }
);

// Performance Indexes
fieldInstructionSchema.index({ apartment: 1 }); // Fast queries by apartment
fieldInstructionSchema.index({ project: 1 }); // Fast queries by project
fieldInstructionSchema.index({ author: 1 }); // Fast queries by author
fieldInstructionSchema.index({ status: 1 }); // Fast queries by status
fieldInstructionSchema.index({ priority: 1 }); // Fast queries by priority
fieldInstructionSchema.index({ category: 1 }); // Fast queries by category
fieldInstructionSchema.index({ apartment: 1, status: 1 }); // Compound index for apartment + status
fieldInstructionSchema.index({ project: 1, status: 1 }); // Compound index for project + status
fieldInstructionSchema.index({ createdAt: -1 }); // Fast queries by creation date (newest first)
fieldInstructionSchema.index({ dueDate: 1 }); // Fast queries by due date

const FieldInstruction = mongoose.model('FieldInstruction', fieldInstructionSchema);

module.exports = FieldInstruction; 