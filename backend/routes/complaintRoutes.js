const express = require('express');
const router = express.Router();
const {
  createComplaint,
  getUserComplaints,
  getAllComplaints,
  updateComplaintStatus,
} = require('../controllers/complaintController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Citizen routes
router.post('/', protect, authorizeRoles('citizen'), createComplaint);
router.get('/user', protect, authorizeRoles('citizen'), getUserComplaints);

// Admin routes
router.get('/all', protect, authorizeRoles('admin'), getAllComplaints);
router.put('/:id', protect, authorizeRoles('admin'), updateComplaintStatus);

module.exports = router;
