const express = require('express');
const router = express.Router();
const {
  createAnnouncement,
  getAnnouncementsForUser,
} = require('../controllers/announcementController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Admin: create announcement
router.post('/', protect, authorizeRoles('admin'), createAnnouncement);

// Citizen: get area-filtered announcements
router.get('/', protect, getAnnouncementsForUser);

module.exports = router;
