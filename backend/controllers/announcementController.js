const Announcement = require('../models/Announcement');
const { emitToArea } = require('../sockets/socketHandler');
const { AREAS } = require('../utils/areaEnum');

// @route  POST /api/announcements
// @access Private (admin)
const createAnnouncement = async (req, res) => {
  const { title, content, areas } = req.body;

  if (!title || !content || !areas || areas.length === 0) {
    return res.status(400).json({ message: 'title, content and at least one area are required' });
  }

  // Validate all areas
  for (const area of areas) {
    if (!AREAS.includes(area)) {
      return res.status(400).json({ message: `Invalid area: ${area}. Choose valid Pune areas.`, validAreas: AREAS });
    }
  }

  try {
    const announcement = await Announcement.create({
      title,
      content,
      areas,
      createdBy: req.user._id,
    });

    // Real-time notification to all connected users in the same areas
    const io = req.app.get('io');
    areas.forEach((area) => {
      emitToArea(io, area, 'notification', {
        type: 'new_announcement',
        message: `New announcement in your area: "${title}"`,
        announcementId: announcement._id,
      });
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
    const announcements = await Announcement.find({ areas: req.user.area })
      .sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route  GET /api/announcements/admin/all
// @access Private (admin)
const getAllAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route  DELETE /api/announcements/:id
// @access Private (admin)
const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    // Check if user is the creator or admin
    if (announcement.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this announcement' });
    }

    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ message: 'Announcement deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { createAnnouncement, getAnnouncementsForUser, getAllAnnouncements, deleteAnnouncement };
