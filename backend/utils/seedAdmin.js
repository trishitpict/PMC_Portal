const User = require('../models/User');

const seedAdmin = async () => {
  try {
    const existing = await User.findOne({ email: 'admin@gmail.com' });
    if (existing) {
      console.log('Admin user already exists — skipping seed.');
      return;
    }

    // Pass plain password — the User pre-save hook will hash it automatically
    await User.create({
      name: 'PMC Admin',
      email: 'admin@gmail.com',
      password: '123456',
      role: 'admin',
      area: 'Shivajinagar',
    });

    console.log('✅ Default admin created: admin@gmail.com / 123456');
  } catch (error) {
    console.error('❌ Admin seed failed:', error.message);
  }
};

module.exports = seedAdmin;
