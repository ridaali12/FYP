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
