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