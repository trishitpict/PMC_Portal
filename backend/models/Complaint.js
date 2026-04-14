const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'resolved'],
      default: 'pending',
    },
    remarks: {
      type: String,
      default: '',
    },
    location: {
      coordinates: {
        latitude: {
          type: Number,
          required: false,
        },
        longitude: {
          type: Number,
          required: false,
        },
      },
      address: {
        type: String,
        default: '',
      },
      area: {
        type: String,
        default: '',
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Complaint', complaintSchema);
