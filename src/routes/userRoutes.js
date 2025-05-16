const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);

// Protected routes
router.get('/profile', auth, userController.getProfile);
router.put('/profile', auth, userController.updateProfile);
router.get('/available', auth, userController.getAllUsers);
router.get('/check-admin', auth, userController.checkAdminStatus);

// Admin routes (require both auth and adminAuth)
router.get('/admin/users', auth, adminAuth, userController.adminGetAllUsers);
router.delete('/admin/users/:id', auth, adminAuth, userController.adminDeleteUser);

module.exports = router; 