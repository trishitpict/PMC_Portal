const Announcement = require('../models/Announcement');
const { emitToArea } = require('../sockets/socketHandler');
const { AREAS } = require('../utils/areaEnum');

// @route  POST /api/announcements
// @access Private (admin)
const createAnnouncement = async (req, res) => {
  const { title, content, area } = req.body;

  if (!title || !content || !area) {
    return res.status(400).json({ message: 'title, content and area are required' });
  }

  if (!AREAS.includes(area)) {
    return res.status(400).json({ message: 'Invalid area. Choose a valid Pune area.', validAreas: AREAS });
  }

  try {
    const announcement = await Announcement.create({
      title,
      content,
      area,
      createdBy: req.user._id,
    });

    // Real-time notification to all connected users in the same area
    const io = req.app.get('io');
    emitToArea(io, area, 'notification', {
      type: 'new_announcement',
      message: `New announcement in your area: "${title}"`,
      announcementId: announcement._id,
    });

    res.status(201).json(announcement);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route  GET /api/announcements
// @access Private (citizen)
const getAnnouncementsForUser = async (req, res) => {
  try {
    const announcements = await Announcement.find({ area: req.user.area })
      .sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { createAnnouncement, getAnnouncementsForUser };
