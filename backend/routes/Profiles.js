const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');
const User = require('../models/User');

// Get profile image by userId
router.get('/:userId/image', async (req, res) => {
  try {
    const { userId } = req.params;

    // Find profile
    const profile = await Profile.findOne({ userId });

    if (!profile || !profile.profileImage) {
      return res.status(404).json({ 
        success: false,
        message: 'Profile image not found' 
      });
    }

    res.status(200).json({
      success: true,
      profileImage: profile.profileImage,
      imageType: profile.imageType
    });
  } catch (error) {
    console.error('Get profile image error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Upload/Update profile image
router.post('/:userId/image', async (req, res) => {
  try {
    const { userId } = req.params;
    const { profileImage, imageType } = req.body;

    if (!profileImage) {
      return res.status(400).json({ message: 'Profile image is required' });
    }

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find or create profile
    let profile = await Profile.findOne({ userId });
    
    if (!profile) {
      // Create new profile with only image data
      profile = new Profile({
        userId,
        username: user.username,
        email: user.email,
        profileImage,
        imageType: imageType || 'image/jpeg'
      });
    } else {
      // Update only image fields
      profile.profileImage = profileImage;
      profile.imageType = imageType || 'image/jpeg';
    }

    await profile.save();

    res.status(200).json({
      success: true,
      message: 'Profile image uploaded successfully',
      profileImage: profile.profileImage,
      imageType: profile.imageType
    });
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete profile image
router.delete('/:userId/image', async (req, res) => {
  try {
    const { userId } = req.params;

    const profile = await Profile.findOne({ userId });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    profile.profileImage = null;
    profile.imageType = 'image/jpeg';
    await profile.save();

    res.status(200).json({
      success: true,
      message: 'Profile image deleted successfully'
    });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;