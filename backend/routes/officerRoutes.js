const express = require('express');
const router = express.Router();

const { listOfficers, createOfficer } = require('../controllers/officerController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.get('/', protect, listOfficers);

// Create (admin)
router.post('/', protect, authorizeRoles('admin'), createOfficer);

module.exports = router;
