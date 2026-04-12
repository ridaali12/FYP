// Run this script once to mark any existing researchers as verified.
// Usage: node backend/scripts/auto-verify-researchers.js

const mongoose = require('mongoose');
const Researcher = require('../models/Researcher');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wildlife';

async function main() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    const result = await Researcher.updateMany(
      { verified: { $ne: true } },
      {
        $set: {
          verified: true,
          verifiedAt: new Date(),
          verifiedBy: 'auto-migration',
        },
      }
    );

    console.log(`👉 Matched ${result.matchedCount}, modified ${result.modifiedCount} researcher(s)`);
  } catch (err) {
    console.error('❌ Error updating researchers:', err);
  } finally {
    mongoose.connection.close();
  }
}

main();
