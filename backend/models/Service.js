const mongoose = require('mongoose');

const SERVICE_CATEGORIES = [
  'Fire',
  'Emergency',
  'BloodBank',
  'Ambulance',
  'Hospital',
  'Police',
];

const tenDigitPhone = /^\d{10}$/;

const isValidUrl = (value) => {
  if (!value) return true;
  try {
    // eslint-disable-next-line no-new
    new URL(String(value));
    return true;
  } catch {
    return false;
  }
};

const baseServiceSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: SERVICE_CATEGORIES,
      required: true,
      index: true,
    },

    // Optional shared field for card listings (keeps the earlier UI intact)
    imageURL: {
      type: String,
      default: 'https://placehold.co/1200x600?text=Municipal+Service',
      trim: true,
    },
  },
  {
    timestamps: true,
    discriminatorKey: 'category',
  }
);

const Service = mongoose.model('Service', baseServiceSchema);

// ── Fire / Hospital / Police ───────────────────────────────────────────────
const commonPlaceSchema = {
  name: { type: String, required: true, trim: true, index: true },
  address: { type: String, required: true, trim: true, index: true },
  phone: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: (v) => tenDigitPhone.test(String(v)),
      message: 'Phone must be 10 digits',
    },
  },

  // Optional subtype to support filtering (e.g., Maternity/General)
  subType: { type: String, default: '', trim: true, index: true },
};

Service.discriminator('Fire', new mongoose.Schema(commonPlaceSchema, { _id: false }));
Service.discriminator('Hospital', new mongoose.Schema(commonPlaceSchema, { _id: false }));
Service.discriminator('Police', new mongoose.Schema(commonPlaceSchema, { _id: false }));

// ── Emergency ──────────────────────────────────────────────────────────────
Service.discriminator(
  'Emergency',
  new mongoose.Schema(
    {
      name: { type: String, required: true, trim: true, index: true },
      phone: {
        type: String,
        required: true,
        trim: true,
        validate: {
          validator: (v) => tenDigitPhone.test(String(v)),
          message: 'Phone must be 10 digits',
        },
      },
    },
    { _id: false }
  )
);

// ── Blood Bank ─────────────────────────────────────────────────────────────
Service.discriminator(
  'BloodBank',
  new mongoose.Schema(
    {
      name: { type: String, required: true, trim: true, index: true },
      address: { type: String, required: true, trim: true, index: true },
      contact: {
        type: String,
        required: true,
        trim: true,
        validate: {
          validator: (v) => tenDigitPhone.test(String(v)),
          message: 'Contact must be 10 digits',
        },
      },
      gmapLink: {
        type: String,
        default: '',
        trim: true,
        validate: {
          validator: isValidUrl,
          message: 'gmapLink must be a valid URL',
        },
      },
    },
    { _id: false }
  )
);

// ── Ambulance ──────────────────────────────────────────────────────────────
Service.discriminator(
  'Ambulance',
  new mongoose.Schema(
    {
      srNo: { type: Number, required: true, min: 1, index: true },
      vehicleRegNo: { type: String, required: true, trim: true, index: true },
      vehicleType: { type: String, required: true, trim: true },
      driverName: { type: String, required: true, trim: true },
      mobileNo: {
        type: String,
        required: true,
        trim: true,
        validate: {
          validator: (v) => tenDigitPhone.test(String(v)),
          message: 'Mobile No. must be 10 digits',
        },
      },
      workingHours: { type: String, required: true, trim: true },
      workLocation: { type: String, required: true, trim: true, index: true },
    },
    { _id: false }
  )
);

module.exports = {
  Service,
  SERVICE_CATEGORIES,
};
