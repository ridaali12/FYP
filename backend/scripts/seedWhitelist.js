// ================================================================
// FILE: backend/scripts/seedWhitelist.js
// ================================================================
// Run this ONCE to seed the approved researcher whitelist
// into MongoDB as a separate collection.
//
// Usage: node backend/scripts/seedWhitelist.js
// ================================================================

const mongoose = require('mongoose');
require('dotenv').config();

const { approvedResearchers } = require('../data/approvedResearchers');

// ── Whitelist Schema ────────────────────────────────────────────
const whitelistSchema = new mongoose.Schema({
  name: { type: String, required: true },
  orcid: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  institution: { type: String, required: true },
  specialization: { type: String, required: true },
  addedAt: { type: Date, default: Date.now },
});

const ResearcherWhitelist = mongoose.model('ResearcherWhitelist', whitelistSchema);

async function seedWhitelist() {
  const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wildlife-app';

  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: 'wildlife-app',
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing whitelist (fresh seed)
    await ResearcherWhitelist.deleteMany({});
    console.log('🗑️  Cleared existing whitelist entries');

    // Insert all 50 researchers
    const result = await ResearcherWhitelist.insertMany(
      approvedResearchers.map((r) => ({
        name: r.name,
        orcid: r.orcid,
        email: r.email.toLowerCase(),
        institution: r.institution,
        specialization: r.specialization,
      }))
    );

    console.log(`✅ Seeded ${result.length} approved researchers into whitelist`);
    console.log('\nSample entries:');
    result.slice(0, 3).forEach((r) => {
      console.log(`  • ${r.name} | ${r.orcid} | ${r.email}`);
    });
    console.log('  ...');

  } catch (err) {
    console.error('❌ Seeding error:', err);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 MongoDB connection closed');
  }
}

seedWhitelist();
