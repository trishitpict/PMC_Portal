const express = require('express');
const router = express.Router();
const {
  createAnnouncement,
  getAnnouncementsForUser,
  getAllAnnouncements,
  deleteAnnouncement,
} = require('../controllers/announcementController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Admin: create announcement
router.post('/', protect, authorizeRoles('admin'), createAnnouncement);

// Admin: get all announcements (must be before get for user)
router.get('/admin/all', protect, authorizeRoles('admin'), getAllAnnouncements);

// Admin: delete announcement
router.delete('/:id', protect, authorizeRoles('admin'), deleteAnnouncement);

// Citizen: get area-filtered announcements
router.get('/', protect, getAnnouncementsForUser);

module.exports = router;
