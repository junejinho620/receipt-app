const express = require('express');
const router = express.Router();
const { User, Entry } = require('../models');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// Compute level and progress from totalEntries
// Level up every 10 entries: Lv1=0-9, Lv2=10-19, etc.
function computeLevel(totalEntries) {
  const level = Math.floor(totalEntries / 10) + 1;
  const progress = (totalEntries % 10) / 10;
  return { level, progress };
}

// GET /api/users/profile — get authenticated user's live profile + stats
router.get('/profile', auth, async (req, res) => {
  try {
    const user = req.user;

    // Count entries this calendar month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const thisMonthEntries = await Entry.countDocuments({
      userId: user._id,
      date: { $gte: monthStart, $lte: monthEnd }
    });

    const { level, progress } = computeLevel(user.stats.totalEntries);

    res.json({
      success: true,
      data: {
        username: user.username,
        email: user.email,
        profile: user.profile,
        stats: {
          currentStreak: user.stats.currentStreak || 0,
          longestStreak: user.stats.longestStreak || 0,
          totalEntries: user.stats.totalEntries || 0,
          thisMonthEntries,
          lastEntryDate: user.stats.lastEntryDate
        },
        level,
        levelProgress: progress
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
});

// PUT /api/users/profile — update username, email, displayName, password
router.put('/profile', auth, async (req, res) => {
  try {
    const user = req.user;
    const { email, displayName, username, currentPassword, newPassword } = req.body;

    // Update password if provided (plain text since no bcrypt in this build)
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, error: 'Current password is required' });
      }
      if (currentPassword !== user.passwordHash) {
        return res.status(401).json({ success: false, error: 'Current password is incorrect' });
      }
      user.passwordHash = newPassword;
    }

    // Update username if provided
    if (username && username !== user.username) {
      const trimmed = username.trim();
      if (trimmed.length < 3 || trimmed.length > 30) {
        return res.status(400).json({
          success: false,
          error: 'Username must be between 3 and 30 characters'
        });
      }
      const existing = await User.findOne({ username: trimmed, _id: { $ne: user._id } });
      if (existing) {
        return res.status(400).json({
          success: false,
          error: 'That username is already taken'
        });
      }
      user.username = trimmed;
    }

    // Update email if provided
    if (email && email !== user.email) {
      const existing = await User.findOne({ email, _id: { $ne: user._id } });
      if (existing) {
        return res.status(400).json({
          success: false,
          error: 'Email is already in use'
        });
      }
      user.email = email;
    }

    // Update display name if provided
    if (displayName !== undefined) {
      user.profile = user.profile || {};
      user.profile.displayName = displayName;
      user.markModified('profile'); // Required for Mongoose to track nested object changes
    }

    await user.save();

    res.json({
      success: true,
      data: {
        username: user.username,
        email: user.email,
        profile: user.profile
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to update profile' });
  }
});

// PUT /api/users/avatar — upload profile avatar photo
router.put('/avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file uploaded' });
    }

    const user = req.user;
    user.profile = user.profile || {};
    user.profile.avatar = `/uploads/${req.file.filename}`;
    user.markModified('profile'); // Tell Mongoose the nested object changed
    await user.save();

    res.json({
      success: true,
      data: { avatarUrl: user.profile.avatar }
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ success: false, error: 'Failed to upload avatar' });
  }
});

module.exports = router;
