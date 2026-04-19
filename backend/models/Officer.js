const mongoose = require('mongoose');

const OfficerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'name is required'],
      trim: true,
    },
    designation: {
      type: String,
      required: [true, 'designation is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    mobile: {
      type: String,
      required: [true, 'mobile is required'],
      trim: true,
      match: [/^\d{10}$/, 'Mobile must be a 10-digit number'],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Officer', OfficerSchema);
