const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const Researcher = require('../models/Researcher');
const Report = require('../models/Report');
const User = require('../models/User');

// email helper used for notification on approval/rejection
const { sendEmail } = require('../utils/email');

// ===== ADMIN AUTHENTICATION =====

// POST /api/admin/login - Admin login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide username and password' });
    }

    const admin = await Admin.findOne({ username });

    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password (in production, use bcrypt.compare)
    if (admin.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({
      message: 'Admin login successful',
      admin: {
        _id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error during admin login' });
  }
});

// ===== RESEARCHER VERIFICATION =====

// GET /api/admin/researchers/pending - Get all pending (unverified) researchers
router.get('/researchers/pending', async (req, res) => {
  try {
    const pendingResearchers = await Researcher.find({ verified: false }).sort({ createdAt: -1 });
    res.json({
      count: pendingResearchers.length,
      researchers: pendingResearchers.map((r) => ({
        _id: r._id,
        username: r.username,
        email: r.email,
        orcid: r.orcid,
        education: r.education,
        createdAt: r.createdAt,
        verified: r.verified,
      })),
    });
  } catch (error) {
    console.error('Error fetching pending researchers:', error);
    res.status(500).json({ message: 'Failed to fetch pending researchers' });
  }
});

// GET /api/admin/researchers/all - Get all researchers (verified and unverified)
router.get('/researchers/all', async (req, res) => {
  try {
    const allResearchers = await Researcher.find().sort({ createdAt: -1 });
    res.json({
      count: allResearchers.length,
      researchers: allResearchers.map((r) => ({
        _id: r._id,
        username: r.username,
        email: r.email,
        orcid: r.orcid,
        education: r.education,
        verified: r.verified,
        verifiedAt: r.verifiedAt,
        verifiedBy: r.verifiedBy,
        rejectionReason: r.rejectionReason,
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching all researchers:', error);
    res.status(500).json({ message: 'Failed to fetch researchers' });
  }
});

// POST /api/admin/researchers/:id/verify - Verify researcher qualifications
router.post('/researchers/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminUsername } = req.body; // Admin who is verifying

    if (!adminUsername) {
      return res.status(400).json({ message: 'Admin username is required' });
    }

    const researcher = await Researcher.findById(id);

    if (!researcher) {
      return res.status(404).json({ message: 'Researcher not found' });
    }

    if (researcher.verified) {
      return res.status(400).json({ message: 'Researcher is already verified' });
    }

    // double-check ORCID validity before approving
    const { isValidOrcid } = require('../utils/orcid');
    if (!isValidOrcid(researcher.orcid)) {
      return res.status(400).json({ message: 'Cannot verify researcher: invalid ORCID' });
    }

    researcher.verified = true;
    researcher.verifiedAt = new Date();
    researcher.verifiedBy = adminUsername;
    researcher.rejectionReason = null;

    await researcher.save();

    // notify researcher by email that their account has been approved
    try {
      const subject = 'Your researcher account has been approved';
      const html = `
        <p>Hello <strong>${researcher.username}</strong>,</p>
        <p>Good news! Your researcher account has been reviewed and <strong>approved</strong> by an administrator.</p>
        <p>You can now <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login">log in</a> to the application and access the researcher home screen.</p>
        <p>Thank you for registering with the Wildlife App.</p>
      `;
      const text = `Hello ${researcher.username},

Your researcher account has been approved by an administrator. You may now log in to the application: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/login

Thank you for registering with the Wildlife App.`;
      await sendEmail(researcher.email, subject, html, text);
    } catch (emailErr) {
      console.error('Error sending verification email:', emailErr);
    }

    res.json({
      message: 'Researcher verified successfully',
      researcher: {
        _id: researcher._id,
        username: researcher.username,
        email: researcher.email,
        orcid: researcher.orcid,
        verified: researcher.verified,
        verifiedAt: researcher.verifiedAt,
        verifiedBy: researcher.verifiedBy,
      },
    });
  } catch (error) {
    console.error('Error verifying researcher:', error);
    res.status(500).json({ message: 'Failed to verify researcher' });
  }
});

// POST /api/admin/researchers/:id/reject - Reject researcher (with reason)
router.post('/researchers/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminUsername, rejectionReason } = req.body;

    if (!adminUsername) {
      return res.status(400).json({ message: 'Admin username is required' });
    }

    if (!rejectionReason || rejectionReason.trim().length === 0) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const researcher = await Researcher.findById(id);

    if (!researcher) {
      return res.status(404).json({ message: 'Researcher not found' });
    }

    researcher.verified = false;
    researcher.rejectionReason = rejectionReason.trim();
    researcher.verifiedBy = adminUsername;
    researcher.verifiedAt = new Date();

    await researcher.save();

    // send email notification about rejection
    try {
      const subject = 'Researcher account verification rejected';
      const html = `
        <p>Hello <strong>${researcher.username}</strong>,</p>
        <p>Unfortunately, your researcher account verification has been <strong>rejected</strong> by an administrator.</p>
        <p>Reason provided:</p>
        <blockquote>${rejectionReason.trim()}</blockquote>
        <p>Please review your information and update it accordingly before resubmitting.</p>
        <p>You can update your details <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/education">here</a>.</p>
      `;
      const text = `Hello ${researcher.username},

Your researcher account verification was rejected by an administrator.

Reason: ${rejectionReason.trim()}

Please review and update your information before resubmitting.

${process.env.FRONTEND_URL || 'http://localhost:3000'}/education`;
      await sendEmail(researcher.email, subject, html, text);
    } catch (emailErr) {
      console.error('Error sending rejection email:', emailErr);
    }

    res.json({
      message: 'Researcher rejected',
      researcher: {
        _id: researcher._id,
        username: researcher.username,
        email: researcher.email,
        verified: researcher.verified,
        rejectionReason: researcher.rejectionReason,
        verifiedBy: researcher.verifiedBy,
      },
    });
  } catch (error) {
    console.error('Error rejecting researcher:', error);
    res.status(500).json({ message: 'Failed to reject researcher' });
  }
});

// ===== REPORT MANAGEMENT (SPAM & INAPPROPRIATE CONTENT) =====

// GET /api/admin/reports/all - Get all reports (including spam/inappropriate)
router.get('/reports/all', async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    res.json({
      count: reports.length,
      reports: reports.map((r) => ({
        _id: r._id,
        specieName: r.specieName,
        healthStatus: r.healthStatus,
        location: r.location,
        timestamp: r.timestamp,
        username: r.username,
        userId: r.userId,
        image: r.image,
        isSpam: r.isSpam || false,
        isInappropriate: r.isInappropriate || false,
        flaggedBy: r.flaggedBy,
        flaggedAt: r.flaggedAt,
        deletedBy: r.deletedBy,
        deletedAt: r.deletedAt,
        createdAt: r.createdAt,
        commentsCount: r.comments ? r.comments.length : 0,
      })),
    });
  } catch (error) {
    console.error('Error fetching all reports:', error);
    res.status(500).json({ message: 'Failed to fetch reports' });
  }
});

// GET /api/admin/reports/flagged - Get flagged reports (spam or inappropriate)
router.get('/reports/flagged', async (req, res) => {
  try {
    const flaggedReports = await Report.find({
      $or: [{ isSpam: true }, { isInappropriate: true }],
    }).sort({ flaggedAt: -1 });

    res.json({
      count: flaggedReports.length,
      reports: flaggedReports.map((r) => ({
        _id: r._id,
        specieName: r.specieName,
        healthStatus: r.healthStatus,
        location: r.location,
        timestamp: r.timestamp,
        username: r.username,
        userId: r.userId,
        image: r.image,
        isSpam: r.isSpam,
        isInappropriate: r.isInappropriate,
        flaggedBy: r.flaggedBy,
        flaggedAt: r.flaggedAt,
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching flagged reports:', error);
    res.status(500).json({ message: 'Failed to fetch flagged reports' });
  }
});

// POST /api/admin/reports/:id/flag-spam - Mark report as spam
router.post('/reports/:id/flag-spam', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminUsername } = req.body;

    if (!adminUsername) {
      return res.status(400).json({ message: 'Admin username is required' });
    }

    const report = await Report.findById(id);

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    report.isSpam = true;
    report.flaggedBy = adminUsername;
    report.flaggedAt = new Date();

    await report.save();

    res.json({
      message: 'Report marked as spam',
      report: {
        _id: report._id,
        specieName: report.specieName,
        isSpam: report.isSpam,
        flaggedBy: report.flaggedBy,
        flaggedAt: report.flaggedAt,
      },
    });
  } catch (error) {
    console.error('Error flagging report as spam:', error);
    res.status(500).json({ message: 'Failed to flag report as spam' });
  }
});

// POST /api/admin/reports/:id/flag-inappropriate - Mark report as inappropriate
router.post('/reports/:id/flag-inappropriate', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminUsername } = req.body;

    if (!adminUsername) {
      return res.status(400).json({ message: 'Admin username is required' });
    }

    const report = await Report.findById(id);

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    report.isInappropriate = true;
    report.flaggedBy = adminUsername;
    report.flaggedAt = new Date();

    await report.save();

    res.json({
      message: 'Report marked as inappropriate',
      report: {
        _id: report._id,
        specieName: report.specieName,
        isInappropriate: report.isInappropriate,
        flaggedBy: report.flaggedBy,
        flaggedAt: report.flaggedAt,
      },
    });
  } catch (error) {
    console.error('Error flagging report as inappropriate:', error);
    res.status(500).json({ message: 'Failed to flag report as inappropriate' });
  }
});

// DELETE /api/admin/reports/:id - Delete inappropriate report
router.delete('/reports/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminUsername } = req.body;

    if (!adminUsername) {
      return res.status(400).json({ message: 'Admin username is required' });
    }

    const report = await Report.findById(id);

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Delete report from database (hard delete as per requirement)
    await Report.findByIdAndDelete(id);

    // Return success message as per UC-17 requirement
    res.json({
      message: 'Report removed successfully',
      deletedReport: {
        _id: report._id,
        specieName: report.specieName,
        deletedBy: adminUsername,
        deletedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error deleting report:', error);
    
    // Check if it's a database or network error
    const isDatabaseError = error.name === 'MongoError' || error.name === 'MongooseError';
    const isNetworkError = error.message.includes('network') || error.message.includes('timeout') || error.message.includes('ECONNREFUSED');
    
    // Return error message as per UC-17 alternative scenario requirement
    if (isDatabaseError || isNetworkError) {
      return res.status(500).json({ 
        message: 'Unable to remove content at this time.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    // Generic error fallback
    res.status(500).json({ 
      message: 'Unable to remove content at this time.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/admin/reports/:id/unflag - Remove spam/inappropriate flags
router.post('/reports/:id/unflag', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminUsername } = req.body;

    if (!adminUsername) {
      return res.status(400).json({ message: 'Admin username is required' });
    }

    const report = await Report.findById(id);

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    report.isSpam = false;
    report.isInappropriate = false;
    report.flaggedBy = null;
    report.flaggedAt = null;

    await report.save();

    res.json({
      message: 'Report flags removed successfully',
      report: {
        _id: report._id,
        specieName: report.specieName,
        isSpam: report.isSpam,
        isInappropriate: report.isInappropriate,
      },
    });
  } catch (error) {
    console.error('Error unflagging report:', error);
    res.status(500).json({ message: 'Failed to unflag report' });
  }
});

// ===== USER MANAGEMENT =====

// GET /api/admin/users/all - Get all users (community users and researchers)
router.get('/users/all', async (req, res) => {
  try {
    const [communityUsers, researchers] = await Promise.all([
      User.find().sort({ createdAt: -1 }),
      Researcher.find().sort({ createdAt: -1 }),
    ]);

    // Combine and format users
    const allUsers = [
      ...communityUsers.map((u) => ({
        _id: u._id,
        username: u.username,
        email: u.email,
        userType: 'community',
        createdAt: u.createdAt,
      })),
      ...researchers.map((r) => ({
        _id: r._id,
        username: r.username,
        email: r.email,
        userType: 'researcher',
        verified: r.verified,
        education: r.education,
        createdAt: r.createdAt,
      })),
    ];

    // Sort by creation date (newest first)
    allUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      count: allUsers.length,
      users: allUsers,
    });
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// GET /api/admin/users/:id - Get user details with their reports
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Try to find in User collection first
    let user = await User.findById(id);
    let userType = 'community';

    // If not found, check Researcher collection
    if (!user) {
      user = await Researcher.findById(id);
      userType = 'researcher';
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get all reports submitted by this user
    // Try matching by userId (MongoDB ObjectId) and username (for compatibility)
    const reports = await Report.find({
      $or: [
        { userId: id },
        { userId: id.toString() },
        { username: user.username },
      ],
    }).sort({ createdAt: -1 });

    // Format user data
    const userData = {
      _id: user._id,
      username: user.username,
      email: user.email,
      userType: userType,
      createdAt: user.createdAt,
      reportsCount: reports.length,
      reports: reports.map((r) => ({
        _id: r._id,
        specieName: r.specieName,
        healthStatus: r.healthStatus,
        location: r.location,
        timestamp: r.timestamp,
        image: r.image,
        isSpam: r.isSpam || false,
        isInappropriate: r.isInappropriate || false,
        flaggedBy: r.flaggedBy,
        flaggedAt: r.flaggedAt,
        createdAt: r.createdAt,
        commentsCount: r.comments ? r.comments.length : 0,
      })),
    };

    // Add researcher-specific fields if applicable
    if (userType === 'researcher') {
      userData.verified = user.verified;
      userData.education = user.education;
      userData.verifiedAt = user.verifiedAt;
      userData.verifiedBy = user.verifiedBy;
      userData.rejectionReason = user.rejectionReason;
    }

    res.json(userData);
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: 'Failed to fetch user details' });
  }
});

// ===== DASHBOARD STATS =====

// GET /api/admin/dashboard/stats - Get dashboard statistics
router.get('/dashboard/stats', async (req, res) => {
  try {
    const [
      totalReports,
      spamReports,
      inappropriateReports,
      pendingResearchers,
      verifiedResearchers,
      totalUsers,
    ] = await Promise.all([
      Report.countDocuments(),
      Report.countDocuments({ isSpam: true }),
      Report.countDocuments({ isInappropriate: true }),
      Researcher.countDocuments({ verified: false }),
      Researcher.countDocuments({ verified: true }),
      mongoose.model('User').countDocuments(),
    ]);

    res.json({
      reports: {
        total: totalReports,
        spam: spamReports,
        inappropriate: inappropriateReports,
        normal: totalReports - spamReports - inappropriateReports,
      },
      researchers: {
        pending: pendingResearchers,
        verified: verifiedResearchers,
        total: pendingResearchers + verifiedResearchers,
      },
      users: {
        total: totalUsers,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard statistics' });
  }
});

module.exports = router;
