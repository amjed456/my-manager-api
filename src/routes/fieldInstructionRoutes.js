const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getFieldInstructionsByApartment,
  createFieldInstruction,
  updateFieldInstruction,
  deleteFieldInstruction,
  getFieldInstructionById,
  getFieldInstructionsByStatus,
} = require('../controllers/fieldInstructionController');

// All routes require authentication
router.use(auth);

// Get all field instructions for an apartment
router.get('/apartment/:apartmentId', getFieldInstructionsByApartment);

// Get field instructions by status for an apartment
router.get('/apartment/:apartmentId/status/:status', getFieldInstructionsByStatus);

// Create a new field instruction for an apartment
router.post('/apartment/:apartmentId', upload, createFieldInstruction);

// Get a single field instruction
router.get('/:instructionId', getFieldInstructionById);

// Update a field instruction
router.put('/:instructionId', updateFieldInstruction);

// Delete a field instruction
router.delete('/:instructionId', deleteFieldInstruction);

module.exports = router; 