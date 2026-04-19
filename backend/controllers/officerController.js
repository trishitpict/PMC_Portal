const Officer = require('../models/Officer');

const parseIntOr = (value, fallback) => {
  const parsed = parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

// @route  GET /api/officers?page=1&limit=30
// @access Protected (citizen/admin)
const listOfficers = async (req, res) => {
  try {
    const page = Math.max(1, parseIntOr(req.query.page, 1));

    // Spec requires 30 records per page.
    const limit = 30;

    const skip = (page - 1) * limit;

    const [officers, total] = await Promise.all([
      Officer.find({})
        .sort({ designation: 1, name: 1, _id: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Officer.countDocuments({}),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    res.json({
      officers,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route  POST /api/officers
// @access Private (admin)
const createOfficer = async (req, res) => {
  try {
    const { name, designation, email, mobile } = req.body;

    const officer = await Officer.create({
      name,
      designation,
      email,
      mobile,
    });

    res.status(201).json(officer);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors)
        .map((e) => e.message)
        .join(', ');
      return res.status(400).json({ message: messages });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { listOfficers, createOfficer };
