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

const parseCategories = (value) => {
  if (!value) return [];
  const values = Array.isArray(value) ? value : [value];
  return [...new Set(
    values
      .flatMap((item) => String(item).split(','))
      .map((item) => item.trim())
      .filter(Boolean)
  )];
};

const hasExplicitTime = (value) => typeof value === 'string' && /T\d{2}:\d{2}/.test(value);

const getDateRange = ({ range, from, to }) => {
  const now = new Date();

  if (!range || range === 'all') return { start: null, end: null };

  if (range === 'today') {
    const start = new Date(now);
    const end = new Date(now);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (range === 'last7') {
    const start = new Date(now);
    const end = new Date(now);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (range === 'last30') {
    const start = new Date(now);
    const end = new Date(now);
    start.setDate(start.getDate() - 29);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (range === 'custom') {
    if (!from || !to) {
      return { error: 'from and to are required for custom range' };
    }

    const start = new Date(from);
    const end = new Date(to);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return { error: 'Invalid custom range date values' };
    }

    if (!hasExplicitTime(from)) {
      start.setHours(0, 0, 0, 0);
    }
    if (!hasExplicitTime(to)) {
      end.setHours(23, 59, 59, 999);
    }

    if (start > end) {
      return { error: 'from date cannot be after to date' };
    }

    return { start, end };
  }

  return { error: 'Invalid range value. Use all, today, last7, last30, custom.' };
};

const csvSafe = (value) => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const toCsv = (rows) => {
  const headers = [
    'Complaint ID',
    'Title',
    'Description',
    'Category',
    'Status',
    'Remarks',
    'Citizen Name',
    'Citizen Email',
    'Citizen Area',
    'Location Area',
    'Address',
    'Latitude',
    'Longitude',
    'Created At',
    'Updated At',
  ];

  const lines = rows.map((c) => {
    const lat = c.location?.coordinates?.latitude;
    const lng = c.location?.coordinates?.longitude;
    return [
      c._id,
      c.title,
      c.description,
      c.category,
      c.status,
      c.remarks,
      c.userId?.name,
      c.userId?.email,
      c.userId?.area,
      c.location?.area,
      c.location?.address,
      lat === null || lat === undefined ? '' : lat,
      lng === null || lng === undefined ? '' : lng,
      c.createdAt ? new Date(c.createdAt).toISOString() : '',
      c.updatedAt ? new Date(c.updatedAt).toISOString() : '',
    ].map(csvSafe).join(',');
  });

  return [headers.map(csvSafe).join(','), ...lines].join('\n');
};

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

// @route  GET /api/complaints/report
// @access Private (admin)
const getComplaintsReportCsv = async (req, res) => {
  try {
    const range = String(req.query.range || 'all').toLowerCase();
    const { from, to } = req.query;
    const categories = parseCategories(req.query.categories);
    const includesAllCategories = categories.some((c) => c.toLowerCase() === 'all');

    const dateRange = getDateRange({ range, from, to });
    if (dateRange.error) {
      return res.status(400).json({ message: dateRange.error });
    }

    const filter = {};
    if (dateRange.start && dateRange.end) {
      filter.createdAt = { $gte: dateRange.start, $lte: dateRange.end };
    }

    if (!includesAllCategories && categories.length > 0) {
      filter.category = { $in: categories };
    }

    const complaints = await Complaint.find(filter)
      .populate('userId', 'name email area')
      .sort({ createdAt: -1 });

    const csv = toCsv(complaints);
    const stamp = new Date().toISOString().slice(0, 10);
    const fileName = `complaints-report-${stamp}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    return res.status(200).send(`\uFEFF${csv}`);
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
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
  getComplaintsReportCsv,
  updateComplaintStatus,
  upload,
};
