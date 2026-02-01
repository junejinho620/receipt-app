const express = require('express');
const router = express.Router();
const { Entry, User } = require('../models');
const upload = require('../middleware/upload');
const auth = require('../middleware/auth');

// Create a new entry (daily upload)
router.post('/', auth, upload.array('media', 10), async (req, res) => {
  try {
    const { text, emoji, mood, tags, location, weather, date } = req.body;

    // Process uploaded files
    const media = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const mediaItem = {
          type: getMediaType(file.mimetype),
          url: `/uploads/${file.filename}`,
          metadata: {
            fileSize: file.size,
            mimeType: file.mimetype
          }
        };

        // Add dimensions for images/videos
        if (file.width && file.height) {
          mediaItem.metadata.width = file.width;
          mediaItem.metadata.height = file.height;
        }

        media.push(mediaItem);
      }
    }

    const entry = new Entry({
      userId: req.user._id,
      date: date ? new Date(date) : new Date(),
      text,
      emoji,
      mood,
      media,
      tags: tags ? JSON.parse(tags) : [],
      location: location ? JSON.parse(location) : undefined,
      weather: weather ? JSON.parse(weather) : undefined
    });

    await entry.save();

    // Update user streak
    await req.user.updateStreak(entry.date);

    res.status(201).json({
      success: true,
      data: entry
    });
  } catch (error) {
    console.error('Create entry error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create entry'
    });
  }
});

// Get all entries (paginated)
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, startDate, endDate } = req.query;

    const query = { userId: req.user._id };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const entries = await Entry.find(query)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Entry.countDocuments(query);

    res.json({
      success: true,
      data: entries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get entries error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch entries'
    });
  }
});

// Get entry by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const entry = await Entry.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        error: 'Entry not found'
      });
    }

    res.json({
      success: true,
      data: entry
    });
  } catch (error) {
    console.error('Get entry error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch entry'
    });
  }
});

// Get entries by specific date
router.get('/date/:date', auth, async (req, res) => {
  try {
    const date = new Date(req.params.date);
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const entries = await Entry.find({
      userId: req.user._id,
      date: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: entries
    });
  } catch (error) {
    console.error('Get entries by date error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch entries'
    });
  }
});

// Update entry
router.put('/:id', auth, upload.array('media', 10), async (req, res) => {
  try {
    const entry = await Entry.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        error: 'Entry not found'
      });
    }

    const { text, emoji, mood, tags, location, weather, removeMedia } = req.body;

    // Update fields
    if (text !== undefined) entry.text = text;
    if (emoji !== undefined) entry.emoji = emoji;
    if (mood !== undefined) entry.mood = mood;
    if (tags !== undefined) entry.tags = JSON.parse(tags);
    if (location !== undefined) entry.location = JSON.parse(location);
    if (weather !== undefined) entry.weather = JSON.parse(weather);

    // Remove specified media
    if (removeMedia) {
      const toRemove = JSON.parse(removeMedia);
      entry.media = entry.media.filter(m => !toRemove.includes(m._id.toString()));
    }

    // Add new media
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        entry.media.push({
          type: getMediaType(file.mimetype),
          url: `/uploads/${file.filename}`,
          metadata: {
            fileSize: file.size,
            mimeType: file.mimetype
          }
        });
      }
    }

    await entry.save();

    res.json({
      success: true,
      data: entry
    });
  } catch (error) {
    console.error('Update entry error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update entry'
    });
  }
});

// Delete entry
router.delete('/:id', auth, async (req, res) => {
  try {
    const entry = await Entry.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        error: 'Entry not found'
      });
    }

    // TODO: Delete associated media files from storage

    res.json({
      success: true,
      message: 'Entry deleted'
    });
  } catch (error) {
    console.error('Delete entry error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete entry'
    });
  }
});

// Helper function to determine media type
function getMediaType(mimetype) {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'music';
  return 'image';
}

module.exports = router;
