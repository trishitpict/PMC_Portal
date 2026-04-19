const { Service, SERVICE_CATEGORIES } = require('../models/Service');

const parseIntOr = (value, fallback) => {
  const parsed = parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalize = (value) => (value ? String(value).trim() : '');

const parseBool = (value) => {
  if (value === true) return true;
  const v = normalize(value).toLowerCase();
  return v === 'true' || v === '1' || v === 'yes';
};

const normalizeCategory = (value) => {
  const raw = normalize(value);
  if (!raw) return '';
  const lowered = raw.toLowerCase();

  // Accept both canonical (Fire) and legacy query values (fire, blood_bank)
  const legacyMap = {
    fire: 'Fire',
    hospital: 'Hospital',
    police: 'Police',
    emergency: 'Emergency',
    bloodbank: 'BloodBank',
    blood_bank: 'BloodBank',
    bloodbank: 'BloodBank',
    ambulance: 'Ambulance',
  };

  if (legacyMap[lowered]) return legacyMap[lowered];

  // Try to match canonical enum case-insensitively
  const canonical = SERVICE_CATEGORIES.find((c) => c.toLowerCase() === lowered);
  return canonical || '';
};

// @route  GET /api/services
// @access Protected (citizen/admin)
// Query: category|type, subType, search, page, limit
const listServices = async (req, res) => {
  try {
    const category = normalizeCategory(req.query.category || req.query.type);
    const subType = normalize(req.query.subType);
    const search = normalize(req.query.search);

    const all = parseBool(req.query.all);

    const page = Math.max(1, parseIntOr(req.query.page, 1));
    const limit = Math.min(50, Math.max(1, parseIntOr(req.query.limit, 6)));
    const skip = (page - 1) * limit;

    const filter = {};

    if (category) {
      if (!SERVICE_CATEGORIES.includes(category)) {
        return res.status(400).json({
          message: `Invalid category: ${req.query.category || req.query.type}`,
          validCategories: SERVICE_CATEGORIES,
        });
      }
      filter.category = category;
    }

    // Optional subtype filter (used primarily for Hospital)
    if (subType) filter.subType = subType;

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      filter.$or = [
        { name: regex },
        { address: regex },
        { phone: regex },
        { contact: regex },
        { vehicleRegNo: regex },
        { driverName: regex },
        { mobileNo: regex },
        { workLocation: regex },
        { subType: regex },
      ];
    }

    const sort = category === 'Ambulance'
      ? { srNo: 1, _id: 1 }
      : { createdAt: -1, _id: -1 };

    const listQuery = Service.find(filter)
      // Stable ordering is required for deterministic results.
      .sort(sort)
      .lean();

    if (!all) listQuery.skip(skip).limit(limit);

    const [items, total, availableSubTypes] = await Promise.all([
      listQuery,
      Service.countDocuments(filter),
      category === 'Hospital'
        ? Service.distinct('subType', { category: 'Hospital', subType: { $ne: '' } })
        : Promise.resolve([]),
    ]);

    const pages = all ? 1 : Math.max(1, Math.ceil(total / limit));

    res.json({
      items,
      total,
      page: all ? 1 : page,
      pages,
      limit: all ? total : limit,
      subTypes: availableSubTypes.filter(Boolean).sort(),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route  POST /api/services
// @access Private (admin)
const createService = async (req, res) => {
  try {
    const {
      category: categoryInput,
      type: legacyType,
      name: nameInput,
      title: legacyTitle,
      address,
      phone,
      contact,
      gmapLink,
      srNo,
      vehicleRegNo,
      regNo,
      vehicleType,
      driverName,
      mobileNo,
      phoneNumbers,
      workingHours,
      workLocation,
      subType,
      imageURL,
    } = req.body;

    const category = normalizeCategory(categoryInput || legacyType);
    if (!category) {
      return res.status(400).json({
        message: 'category is required',
        validCategories: SERVICE_CATEGORIES,
      });
    }

    const name = normalize(nameInput || legacyTitle);

    const phonesArray = Array.isArray(phoneNumbers)
      ? phoneNumbers
      : typeof phoneNumbers === 'string'
        ? phoneNumbers
            .split(',')
            .map((n) => n.trim())
            .filter(Boolean)
        : [];

    // Back-compat mapping: old fields -> new
    const mappedPhone = phone || phonesArray[0] || '';
    const mappedMobileNo = mobileNo || phonesArray[0] || '';
    const mappedVehicleRegNo = vehicleRegNo || regNo || '';

    const payload = {
      category,
      imageURL,
    };

    if (category === 'Fire' || category === 'Hospital' || category === 'Police') {
      Object.assign(payload, {
        name,
        address: address || '',
        phone: mappedPhone,
        subType: subType || '',
      });
    } else if (category === 'Emergency') {
      Object.assign(payload, {
        name,
        phone: mappedPhone,
      });
    } else if (category === 'BloodBank') {
      Object.assign(payload, {
        name,
        address: address || '',
        contact: contact || mappedPhone,
        gmapLink: gmapLink || '',
      });
    } else if (category === 'Ambulance') {
      Object.assign(payload, {
        srNo: srNo !== undefined && srNo !== null && srNo !== '' ? Number(srNo) : srNo,
        vehicleRegNo: mappedVehicleRegNo,
        vehicleType: vehicleType || '',
        driverName: driverName || '',
        mobileNo: mappedMobileNo,
        workingHours: workingHours || '',
        workLocation: workLocation || '',
      });
    }

    const service = await Service.create(payload);

    res.status(201).json(service);
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

module.exports = { listServices, createService, SERVICE_CATEGORIES };
