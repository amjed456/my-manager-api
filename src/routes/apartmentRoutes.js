const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getApartmentsByProject,
  createApartment,
  updateApartment,
  deleteApartment,
  getApartmentById,
} = require('../controllers/apartmentController');

// All routes require authentication
router.use(auth);

// Get all apartments for a project
router.get('/project/:projectId', getApartmentsByProject);

// Create a new apartment for a project
router.post('/project/:projectId', createApartment);

// Get a single apartment
router.get('/:apartmentId', getApartmentById);

// Update an apartment
router.put('/:apartmentId', updateApartment);

// Delete an apartment
router.delete('/:apartmentId', deleteApartment);

module.exports = router; 