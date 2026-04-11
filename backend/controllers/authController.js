const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { AREAS } = require('../utils/areaEnum');

// @route  POST /api/auth/register
// @access Public
const register = async (req, res) => {
  const { name, email, password, area } = req.body;  // role intentionally excluded

  if (!name || !email || !password || !area) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  if (!AREAS.includes(area)) {
    return res.status(400).json({ message: 'Invalid area. Choose a valid Pune area.', validAreas: AREAS });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const user = await User.create({
      name,
      email,
      password,
      area,
      role: 'citizen',  // Always citizen — admin created only via seed
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      area: user.area,
      token: generateToken(user._id),
    });
  } catch (error) {
    // Surface Mongoose validation errors as 400, not 500
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message).join(', ');
      return res.status(400).json({ message: messages });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route  POST /api/auth/login
// @access Public
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  try {
    const user = await User.findOne({ email });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      area: user.area,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route  GET /api/auth/me
// @access Private
const getMe = async (req, res) => {
  const { _id, name, email, role, area } = req.user;
  res.json({ _id, name, email, role, area });
};

module.exports = { register, login, getMe };
