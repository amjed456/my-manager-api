const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['To Do', 'In Progress', 'Done'],
      default: 'To Do',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    dueDate: {
      type: Date,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    createdBy: {
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
taskSchema.index({ project: 1 }); // Fast queries by project (most common)
taskSchema.index({ assignedTo: 1 }); // Fast queries by assigned user
taskSchema.index({ createdBy: 1 }); // Fast queries by creator
taskSchema.index({ status: 1 }); // Fast queries by status
taskSchema.index({ priority: 1 }); // Fast queries by priority
taskSchema.index({ dueDate: 1 }); // Fast queries by due date
taskSchema.index({ createdAt: -1 }); // Fast queries by creation date (newest first)
taskSchema.index({ project: 1, status: 1 }); // Compound index for project + status (very common)
taskSchema.index({ project: 1, assignedTo: 1 }); // Compound index for project + assignee
taskSchema.index({ assignedTo: 1, status: 1 }); // Compound index for assignee + status
taskSchema.index({ project: 1, dueDate: 1 }); // Compound index for project + due date
taskSchema.index({ title: 'text', description: 'text' }); // Text search index

// Middleware to update project progress when a task is saved
taskSchema.post('save', async function () {
  // Get the Project model
  const Project = mongoose.model('Project');
  const Task = mongoose.model('Task');
  
  // Find all tasks for this project
  const tasks = await Task.find({ project: this.project });
  
  // Calculate progress based on completed tasks
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'Done').length;
  
  // Update project progress (percentage)
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  // Update the project
  await Project.findByIdAndUpdate(this.project, { progress });
});

// Same middleware for when a task is deleted
taskSchema.post('deleteOne', { document: true }, async function () {
  const Project = mongoose.model('Project');
  const Task = mongoose.model('Task');
  
  const tasks = await Task.find({ project: this.project });
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'Done').length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  await Project.findByIdAndUpdate(this.project, { progress });
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task; 