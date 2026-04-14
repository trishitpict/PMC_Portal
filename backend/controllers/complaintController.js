const Complaint = require('../models/Complaint');
const { emitToUser } = require('../sockets/socketHandler');

// @route  POST /api/complaints
// @access Private (citizen)
const createComplaint = async (req, res) => {
  const { title, description, category, location } = req.body;

  if (!title || !description || !category) {
    return res.status(400).json({ message: 'title, description and category are required' });
  }

  try {
    const complaint = await Complaint.create({
      userId: req.user._id,
      title,
      description,
      category,
      location: location || {
        coordinates: { latitude: null, longitude: null },
        address: '',
        area: '',
      },
    });

    res.status(201).json(complaint);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route  GET /api/complaints/user
// @access Private (citizen)
const getUserComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route  GET /api/complaints/all
// @access Private (admin)
const getAllComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate('userId', 'name email area')
      .sort({ createdAt: -1 });
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route  PUT /api/complaints/:id
// @access Private (admin)
const updateComplaintStatus = async (req, res) => {
  const { status, remarks } = req.body;
  const validStatuses = ['pending', 'in_progress', 'resolved'];

  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (status) complaint.status = status;
    if (remarks !== undefined) complaint.remarks = remarks;

    const updated = await complaint.save();

    // Real-time notification to the complaint owner
    const io = req.app.get('io');
    emitToUser(io, complaint.userId.toString(), 'notification', {
      type: 'complaint_update',
      message: `Your complaint status has been updated to "${updated.status}"`,
      complaintId: updated._id,
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createComplaint,
  getUserComplaints,
  getAllComplaints,
  updateComplaintStatus,
};
