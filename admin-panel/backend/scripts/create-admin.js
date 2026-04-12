const mongoose = require('mongoose');
const Admin = require('../models/Admin');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wildlife-app';

async function createAdmin() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: 'wildlife-app',
    });

    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('⚠️  Admin account already exists!');
      console.log('   Username: admin');
      console.log('   Email:', existingAdmin.email);
      process.exit(0);
    }

    // Create admin account
    const admin = new Admin({
      username: 'admin',
      email: 'admin@wildlifeapp.com',
      password: 'admin123', // ⚠️ CHANGE THIS PASSWORD!
      role: 'admin',
    });

    await admin.save();
    console.log('✅ Admin account created successfully!');
    console.log('');
    console.log('📋 Admin Credentials:');
    console.log('   Username: admin');
    console.log('   Email: admin@wildlifeapp.com');
    console.log('   Password: admin123');
    console.log('');
    console.log('⚠️  IMPORTANT: Change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();
