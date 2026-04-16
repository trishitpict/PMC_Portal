const Complaint = require('../models/Complaint');
const { emitToUser } = require('../sockets/socketHandler');
const multer = require('multer');
const path = require('path');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Store in uploads folder
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// @route  POST /api/complaints
// @access Private (citizen)
const createComplaint = async (req, res) => {
  const { title, description, category, location } = req.body;

  if (!title || !description || !category) {
    return res.status(400).json({ message: 'title, description and category are required' });
  }

  // Parse location if it's a string
  let parsedLocation = location;
  if (typeof location === 'string') {
    try {
      parsedLocation = JSON.parse(location);
    } catch (e) {
      parsedLocation = {
        coordinates: { latitude: null, longitude: null },
        address: '',
        area: '',
      };
    }
  }

  // Get uploaded file paths
  const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

  try {
    const complaint = await Complaint.create({
      userId: req.user._id,
      title,
      description,
      category,
      location: parsedLocation || {
        coordinates: { latitude: null, longitude: null },
        address: '',
        area: '',
      },
      images,
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
  upload,
};
