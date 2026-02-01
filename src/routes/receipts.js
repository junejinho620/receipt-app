const express = require('express');
const router = express.Router();
const { WeeklyReceipt } = require('../models');
const ReceiptGenerator = require('../services/receiptGenerator');
const auth = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// Get all receipts for user
router.get('/', auth, async (req, res) => {
  try {
    const { limit = 52 } = req.query;

    const receipts = await WeeklyReceipt.getAllForUser(
      req.user._id,
      parseInt(limit)
    );

    res.json({
      success: true,
      data: receipts
    });
  } catch (error) {
    console.error('Get receipts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch receipts'
    });
  }
});

// Get specific receipt by year and week
router.get('/:year/:week', auth, async (req, res) => {
  try {
    const { year, week } = req.params;

    let receipt = await WeeklyReceipt.getByWeek(
      req.user._id,
      parseInt(year),
      parseInt(week)
    );

    // If receipt doesn't exist, generate it
    if (!receipt) {
      const generator = new ReceiptGenerator(
        req.user._id,
        parseInt(year),
        parseInt(week)
      );
      receipt = await generator.generate();

      if (!receipt) {
        return res.status(404).json({
          success: false,
          error: 'No entries found for this week'
        });
      }
    }

    // Mark as viewed
    if (!receipt.viewedAt) {
      receipt.viewedAt = new Date();
      await receipt.save();
    }

    res.json({
      success: true,
      data: receipt
    });
  } catch (error) {
    console.error('Get receipt error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch receipt'
    });
  }
});

// Generate/regenerate receipt for a week
router.post('/generate/:year/:week', auth, async (req, res) => {
  try {
    const { year, week } = req.params;

    const generator = new ReceiptGenerator(
      req.user._id,
      parseInt(year),
      parseInt(week)
    );

    const receipt = await generator.generate();

    if (!receipt) {
      return res.status(404).json({
        success: false,
        error: 'No entries found for this week'
      });
    }

    res.json({
      success: true,
      data: receipt
    });
  } catch (error) {
    console.error('Generate receipt error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate receipt'
    });
  }
});

// Get current week's receipt
router.get('/current', auth, async (req, res) => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const weekNumber = getWeekNumber(now);

    let receipt = await WeeklyReceipt.getByWeek(
      req.user._id,
      year,
      weekNumber
    );

    if (!receipt) {
      const generator = new ReceiptGenerator(req.user._id, year, weekNumber);
      receipt = await generator.generate();
    }

    if (!receipt) {
      return res.status(404).json({
        success: false,
        error: 'No entries found for this week yet'
      });
    }

    res.json({
      success: true,
      data: receipt
    });
  } catch (error) {
    console.error('Get current receipt error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch current receipt'
    });
  }
});

// Share a receipt
router.post('/:id/share', auth, async (req, res) => {
  try {
    const receipt = await WeeklyReceipt.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!receipt) {
      return res.status(404).json({
        success: false,
        error: 'Receipt not found'
      });
    }

    // Generate share token if not exists
    if (!receipt.shareToken) {
      receipt.shareToken = uuidv4();
    }
    receipt.isShared = true;
    await receipt.save();

    res.json({
      success: true,
      data: {
        shareUrl: `/receipts/shared/${receipt.shareToken}`,
        shareToken: receipt.shareToken
      }
    });
  } catch (error) {
    console.error('Share receipt error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to share receipt'
    });
  }
});

// Get shared receipt (public)
router.get('/shared/:token', async (req, res) => {
  try {
    const receipt = await WeeklyReceipt.findOne({
      shareToken: req.params.token,
      isShared: true
    }).populate('userId', 'username profile.displayName profile.avatar');

    if (!receipt) {
      return res.status(404).json({
        success: false,
        error: 'Receipt not found or not shared'
      });
    }

    // Return limited data for shared view
    res.json({
      success: true,
      data: {
        user: {
          username: receipt.userId.username,
          displayName: receipt.userId.profile?.displayName,
          avatar: receipt.userId.profile?.avatar
        },
        weekNumber: receipt.weekNumber,
        year: receipt.year,
        startDate: receipt.startDate,
        endDate: receipt.endDate,
        stats: receipt.stats,
        moodSummary: receipt.moodSummary,
        topEmojis: receipt.topEmojis,
        highlights: receipt.highlights,
        topSongs: receipt.topSongs,
        insights: receipt.insights
      }
    });
  } catch (error) {
    console.error('Get shared receipt error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch shared receipt'
    });
  }
});

// Unshare a receipt
router.delete('/:id/share', auth, async (req, res) => {
  try {
    const receipt = await WeeklyReceipt.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!receipt) {
      return res.status(404).json({
        success: false,
        error: 'Receipt not found'
      });
    }

    receipt.isShared = false;
    await receipt.save();

    res.json({
      success: true,
      message: 'Receipt is no longer shared'
    });
  } catch (error) {
    console.error('Unshare receipt error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unshare receipt'
    });
  }
});

// Helper: Get week number
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

module.exports = router;
