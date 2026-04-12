const express = require('express');
const router = express.Router();
const Report = require('../models/Report');

// GET all reports
router.get('/', async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    console.log(`📊 GET /api/reports - Returning ${reports.length} reports from database`);
    res.json(reports);
  } catch (error) {
    console.error('❌ Error fetching all reports:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET user’s own reports
router.get('/myreports/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const reports = await Report.find({ userId }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch user reports' });
  }
});

// GET single report by ID
router.get('/:id', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST new report
router.post('/', async (req, res) => {
  try {
    const reportData = {
      image: req.body.image,
      specieName: req.body.specieName,
      healthStatus: req.body.healthStatus,
      location: req.body.location,
      timestamp: req.body.timestamp,
      username: req.body.username || 'Anonymous User',
      userId: req.body.userId || 'anonymous',
    };

    const report = new Report(reportData);
    const savedReport = await report.save();
    res.status(201).json(savedReport);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE report
router.delete('/:id', async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ADD comment
router.post('/:id/comment', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    const comment = req.body;
    report.comments = [comment, ...(report.comments || [])];
    await report.save();

    res.status(200).json({ message: 'Comment added' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PIN comment
router.post('/:id/pin', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    report.pinnedComment = req.body.comment;
    await report.save();
    res.json({ message: 'Comment pinned', pinnedComment: report.pinnedComment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UNPIN comment
router.post('/:id/unpin', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    report.pinnedComment = null;
    await report.save();
    res.json({ message: 'Comment unpinned' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
// ─── Haversine Distance Helper ───────────────────────────────────────────────
const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ─── GET /api/reports/nearby?lat=33.72&lon=73.04&radius=15 ──────────────────
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lon, radius = 15 } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ message: 'lat and lon are required' });
    }

    // DB se sab reports fetch karo
    const allReports = await Report.find().sort({ createdAt: -1 });

    // 15km ke andar filter karo
    const nearbyReports = allReports
      .filter(report => {
        if (!report.location?.latitude || !report.location?.longitude) return false;
        const dist = getDistanceKm(
          parseFloat(lat), parseFloat(lon),
          report.location.latitude,
          report.location.longitude
        );
        return dist <= parseFloat(radius);
      })
      .map(report => {
        const dist = getDistanceKm(
          parseFloat(lat), parseFloat(lon),
          report.location.latitude,
          report.location.longitude
        );
        // Severity assign karo distance ke hisaab se
        const severity = dist < 5 ? 'critical' : dist < 10 ? 'high' : 'moderate';
        return {
          id:          report._id,
          species:     report.specieName,
          status:      'Endangered',
          reportedBy:  report.username || 'Anonymous',
          distance:    parseFloat(dist.toFixed(1)),
          time:        timeAgo(report.createdAt),
          lat:         report.location.latitude,
          lon:         report.location.longitude,
          health:      report.healthStatus,
          severity,
          weatherConditions: report.weatherConditions || null,
        };
      });

    res.json(nearbyReports);
  } catch (error) {
    console.error('Nearby alerts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── Time ago helper ─────────────────────────────────────────────────────────
const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60)  return `${seconds} sec ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
};