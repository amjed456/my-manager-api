const FieldInstruction = require('../models/FieldInstruction');
const Apartment = require('../models/Apartment');
const Project = require('../models/Project');

// Get all field instructions for an apartment
const getFieldInstructionsByApartment = async (req, res) => {
  try {
    const { apartmentId } = req.params;
    
    // Check if user has access to the apartment
    const apartment = await Apartment.findById(apartmentId);
    if (!apartment) {
      return res.status(404).json({ message: 'Apartment not found' });
    }
    
    const project = await Project.findById(apartment.project);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to access this apartment' });
    }
    
    const instructions = await FieldInstruction.find({ apartment: apartmentId })
      .populate('author', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(instructions);
  } catch (error) {
    console.error('Error fetching field instructions:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new field instruction
const createFieldInstruction = async (req, res) => {
  try {
    const { apartmentId } = req.params;
    const { 
      title, 
      description, 
      images, 
      priority, 
      category, 
      assignedTo, 
      instructions,
      dueDate,
      attachments,
      instructionType,
      location,
      materials,
      tools,
      safetyNotes,
      steps
    } = req.body;
    
    console.log('Field instruction creation request:', {
      apartmentId,
      body: req.body,
      files: req.files ? req.files.length : 0,
      user: req.user ? req.user.id : 'no user'
    });
    
    // Check if user has access to the apartment
    const apartment = await Apartment.findById(apartmentId);
    if (!apartment) {
      return res.status(404).json({ message: 'Apartment not found' });
    }
    
    const project = await Project.findById(apartment.project);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to create instructions for this apartment' });
    }
    
    // Map frontend priority values to backend enum values
    const priorityMap = {
      'low': 'Low',
      'medium': 'Medium', 
      'high': 'High',
      'urgent': 'Critical'  // frontend uses 'urgent', backend uses 'Critical'
    };
    
    const mappedPriority = priorityMap[priority?.toLowerCase()] || 'Medium';
    
    // Map frontend instruction types to backend category enum values
    const categoryMap = {
      'Construction Task': 'Technical',
      'Installation': 'Technical',
      'Repair/Maintenance': 'Technical',
      'Inspection': 'Quality',
      'Safety Protocol': 'Safety',
      'Quality Control': 'Quality',
      'Material Handling': 'Technical',
      'Equipment Operation': 'Technical',
      'Safety': 'Safety',
      'Quality': 'Quality',
      'Schedule': 'Schedule',
      'Technical': 'Technical',
      'Other': 'Other'
    };
    
    const mappedCategory = categoryMap[instructionType] || categoryMap[category] || 'Other';
    
    // Build instructions text from the various fields
    let instructionText = instructions || description || '';
    if (materials) instructionText += `\n\nMaterials: ${materials}`;
    if (tools) instructionText += `\n\nTools: ${tools}`;
    if (safetyNotes) instructionText += `\n\nSafety Notes: ${safetyNotes}`;
    if (steps && typeof steps === 'string') {
      try {
        const parsedSteps = JSON.parse(steps);
        if (Array.isArray(parsedSteps) && parsedSteps.length > 0) {
          instructionText += '\n\nSteps:';
          parsedSteps.forEach((step, index) => {
            instructionText += `\n${index + 1}. ${step.description}`;
          });
        }
      } catch (e) {
        console.error('Error parsing steps:', e);
      }
    }
    
    const fieldInstruction = new FieldInstruction({
      apartment: apartmentId,
      project: apartment.project,
      author: req.user.id,
      title,
      description,
      images: images || [],
      priority: mappedPriority,
      category: mappedCategory,
      assignedTo: assignedTo || null,
      instructions: instructionText,
      dueDate: dueDate || null,
      attachments: attachments || [],
    });
    
    // Handle file uploads
    if (req.files && req.files.length > 0) {
      const photoUrls = req.files.map(file => `data:${file.mimetype};base64,${file.buffer.toString('base64')}`);
      fieldInstruction.images = photoUrls.map(url => ({ url, caption: '', uploadedAt: new Date() }));
    }
    
    await fieldInstruction.save();
    
    // Populate author and assignedTo info for response
    await fieldInstruction.populate('author', 'name email');
    if (fieldInstruction.assignedTo) {
      await fieldInstruction.populate('assignedTo', 'name email');
    }
    
    res.status(201).json(fieldInstruction);
  } catch (error) {
    console.error('Error creating field instruction:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a field instruction
const updateFieldInstruction = async (req, res) => {
  try {
    const { instructionId } = req.params;
    const { 
      title, 
      description, 
      images, 
      status, 
      priority, 
      category, 
      assignedTo, 
      instructions,
      dueDate,
      attachments,
      startDate,
      completionDate
    } = req.body;
    
    const fieldInstruction = await FieldInstruction.findById(instructionId);
    if (!fieldInstruction) {
      return res.status(404).json({ message: 'Field instruction not found' });
    }
    
    // Check if user has access to the apartment
    const apartment = await Apartment.findById(fieldInstruction.apartment);
    if (!apartment) {
      return res.status(404).json({ message: 'Apartment not found' });
    }
    
    const project = await Project.findById(apartment.project);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this instruction' });
    }
    
    // Update fields
    if (title !== undefined) fieldInstruction.title = title;
    if (description !== undefined) fieldInstruction.description = description;
    if (images !== undefined) fieldInstruction.images = images;
    if (status !== undefined) fieldInstruction.status = status;
    if (priority !== undefined) fieldInstruction.priority = priority;
    if (category !== undefined) fieldInstruction.category = category;
    if (assignedTo !== undefined) fieldInstruction.assignedTo = assignedTo;
    if (instructions !== undefined) fieldInstruction.instructions = instructions;
    if (dueDate !== undefined) fieldInstruction.dueDate = dueDate;
    if (attachments !== undefined) fieldInstruction.attachments = attachments;
    if (startDate !== undefined) fieldInstruction.startDate = startDate;
    if (completionDate !== undefined) fieldInstruction.completionDate = completionDate;
    
    // Auto-set start date when status changes to 'Work Started'
    if (status === 'Work Started' && !fieldInstruction.startDate) {
      fieldInstruction.startDate = new Date();
    }
    
    // Auto-set completion date when status changes to 'Completed'
    if (status === 'Completed' && !fieldInstruction.completionDate) {
      fieldInstruction.completionDate = new Date();
    }
    
    await fieldInstruction.save();
    
    // Populate author and assignedTo info for response
    await fieldInstruction.populate('author', 'name email');
    if (fieldInstruction.assignedTo) {
      await fieldInstruction.populate('assignedTo', 'name email');
    }
    
    res.json(fieldInstruction);
  } catch (error) {
    console.error('Error updating field instruction:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a field instruction
const deleteFieldInstruction = async (req, res) => {
  try {
    const { instructionId } = req.params;
    
    const fieldInstruction = await FieldInstruction.findById(instructionId);
    if (!fieldInstruction) {
      return res.status(404).json({ message: 'Field instruction not found' });
    }
    
    // Check if user has access to the apartment
    const apartment = await Apartment.findById(fieldInstruction.apartment);
    if (!apartment) {
      return res.status(404).json({ message: 'Apartment not found' });
    }
    
    const project = await Project.findById(apartment.project);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this instruction' });
    }
    
    await FieldInstruction.findByIdAndDelete(instructionId);
    
    res.json({ message: 'Field instruction deleted successfully' });
  } catch (error) {
    console.error('Error deleting field instruction:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a single field instruction
const getFieldInstructionById = async (req, res) => {
  try {
    const { instructionId } = req.params;
    
    const fieldInstruction = await FieldInstruction.findById(instructionId)
      .populate('author', 'name email')
      .populate('assignedTo', 'name email');
    
    if (!fieldInstruction) {
      return res.status(404).json({ message: 'Field instruction not found' });
    }
    
    // Check if user has access to the apartment
    const apartment = await Apartment.findById(fieldInstruction.apartment);
    if (!apartment) {
      return res.status(404).json({ message: 'Apartment not found' });
    }
    
    const project = await Project.findById(apartment.project);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to access this instruction' });
    }
    
    res.json(fieldInstruction);
  } catch (error) {
    console.error('Error fetching field instruction:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get field instructions by status for an apartment
const getFieldInstructionsByStatus = async (req, res) => {
  try {
    const { apartmentId, status } = req.params;
    
    // Check if user has access to the apartment
    const apartment = await Apartment.findById(apartmentId);
    if (!apartment) {
      return res.status(404).json({ message: 'Apartment not found' });
    }
    
    const project = await Project.findById(apartment.project);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to access this apartment' });
    }
    
    const instructions = await FieldInstruction.find({ 
      apartment: apartmentId, 
      status: status 
    })
      .populate('author', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(instructions);
  } catch (error) {
    console.error('Error fetching field instructions by status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getFieldInstructionsByApartment,
  createFieldInstruction,
  updateFieldInstruction,
  deleteFieldInstruction,
  getFieldInstructionById,
  getFieldInstructionsByStatus,
}; 