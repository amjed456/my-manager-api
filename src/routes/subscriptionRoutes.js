const express = require('express');
const router = express.Router();
const projectSubscriptionController = require('../controllers/projectSubscriptionController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// All subscription routes require authentication
router.use(auth);

// Get all subscriptions for current admin
router.get('/', adminAuth, projectSubscriptionController.getMySubscriptions);

// Subscribe to a project
router.post('/:projectId/subscribe', adminAuth, projectSubscriptionController.subscribe);

// Unsubscribe from a project
router.post('/:projectId/unsubscribe', adminAuth, projectSubscriptionController.unsubscribe);

// Toggle subscription status
router.post('/:projectId/toggle', adminAuth, projectSubscriptionController.toggleSubscription);

module.exports = router; 