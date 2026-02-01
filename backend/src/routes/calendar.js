const express = require('express');
const router = express.Router();
const { Entry } = require('../models');
const auth = require('../middleware/auth');

// Get calendar data for a specific month
router.get('/:year/:month', auth, async (req, res) => {
  try {
    const { year, month } = req.params;
    const calendarData = await Entry.getCalendarData(
      req.user._id,
      parseInt(year),
      parseInt(month)
    );

    // Get month stats
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const monthStats = await Entry.aggregate([
      {
        $match: {
          userId: req.user._id,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalEntries: { $sum: 1 },
          totalMedia: { $sum: { $size: '$media' } },
          moods: { $push: '$mood' },
          emojis: { $push: '$emoji' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        year: parseInt(year),
        month: parseInt(month),
        days: calendarData,
        stats: monthStats[0] || {
          totalEntries: 0,
          totalMedia: 0,
          moods: [],
          emojis: []
        }
      }
    });
  } catch (error) {
    console.error('Get calendar error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch calendar data'
    });
  }
});

// Get year overview (heat map data)
router.get('/:year', auth, async (req, res) => {
  try {
    const { year } = req.params;
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    const entries = await Entry.aggregate([
      {
        $match: {
          userId: req.user._id,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$date' }
          },
          count: { $sum: 1 },
          hasMedia: { $max: { $gt: [{ $size: '$media' }, 0] } },
          mood: { $first: '$mood' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Convert to heat map format
    const heatMapData = {};
    entries.forEach(entry => {
      heatMapData[entry._id] = {
        count: entry.count,
        hasMedia: entry.hasMedia,
        mood: entry.mood
      };
    });

    // Calculate year stats
    const yearStats = await Entry.aggregate([
      {
        $match: {
          userId: req.user._id,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalEntries: { $sum: 1 },
          totalPhotos: {
            $sum: {
              $size: {
                $filter: {
                  input: '$media',
                  as: 'm',
                  cond: { $eq: ['$$m.type', 'image'] }
                }
              }
            }
          },
          totalVideos: {
            $sum: {
              $size: {
                $filter: {
                  input: '$media',
                  as: 'm',
                  cond: { $eq: ['$$m.type', 'video'] }
                }
              }
            }
          },
          totalSongs: {
            $sum: {
              $size: {
                $filter: {
                  input: '$media',
                  as: 'm',
                  cond: { $eq: ['$$m.type', 'music'] }
                }
              }
            }
          },
          uniqueDays: { $addToSet: { $dateToString: { format: '%Y-%m-%d', date: '$date' } } }
        }
      },
      {
        $project: {
          totalEntries: 1,
          totalPhotos: 1,
          totalVideos: 1,
          totalSongs: 1,
          daysActive: { $size: '$uniqueDays' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        year: parseInt(year),
        heatMap: heatMapData,
        stats: yearStats[0] || {
          totalEntries: 0,
          totalPhotos: 0,
          totalVideos: 0,
          totalSongs: 0,
          daysActive: 0
        }
      }
    });
  } catch (error) {
    console.error('Get year overview error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch year overview'
    });
  }
});

// Get week data
router.get('/week/:year/:week', auth, async (req, res) => {
  try {
    const { year, week } = req.params;

    // Calculate start and end of week
    const startDate = getWeekStart(parseInt(year), parseInt(week));
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);

    const entries = await Entry.find({
      userId: req.user._id,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    // Group entries by day of week
    const weekData = {
      0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: []
    };

    entries.forEach(entry => {
      const dayOfWeek = entry.date.getDay();
      weekData[dayOfWeek].push({
        id: entry._id,
        emoji: entry.emoji,
        mood: entry.mood,
        text: entry.text ? entry.text.substring(0, 100) : null,
        mediaCount: entry.media.length,
        firstMedia: entry.media[0] || null
      });
    });

    res.json({
      success: true,
      data: {
        year: parseInt(year),
        week: parseInt(week),
        startDate,
        endDate,
        days: weekData,
        totalEntries: entries.length
      }
    });
  } catch (error) {
    console.error('Get week data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch week data'
    });
  }
});

// Helper: Get start of a specific week
function getWeekStart(year, week) {
  const date = new Date(year, 0, 1);
  const dayOfWeek = date.getDay();
  const diff = (week - 1) * 7 - dayOfWeek;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

module.exports = router;
