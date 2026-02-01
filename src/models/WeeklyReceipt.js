const mongoose = require('mongoose');

const WeeklyReceiptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // Week identifiers
  weekNumber: {
    type: Number,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  // Stats summary
  stats: {
    totalEntries: { type: Number, default: 0 },
    totalPhotos: { type: Number, default: 0 },
    totalVideos: { type: Number, default: 0 },
    totalSongs: { type: Number, default: 0 },
    totalWords: { type: Number, default: 0 },
    daysActive: { type: Number, default: 0 },
    streakMaintained: { type: Boolean, default: false }
  },
  // Mood analysis
  moodSummary: {
    dominantMood: String,
    moodDistribution: {
      amazing: { type: Number, default: 0 },
      good: { type: Number, default: 0 },
      okay: { type: Number, default: 0 },
      bad: { type: Number, default: 0 },
      terrible: { type: Number, default: 0 }
    },
    averageMoodScore: Number // 1-5 scale
  },
  // Top emojis used
  topEmojis: [{
    emoji: String,
    count: Number
  }],
  // Highlights - best moments of the week
  highlights: [{
    entryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Entry'
    },
    type: {
      type: String,
      enum: ['photo', 'video', 'text', 'music']
    },
    preview: String,
    mediaUrl: String
  }],
  // Top songs of the week
  topSongs: [{
    title: String,
    artist: String,
    playCount: Number,
    albumArt: String
  }],
  // Word cloud data
  topWords: [{
    word: String,
    count: Number
  }],
  // Tags used this week
  topTags: [{
    tag: String,
    count: Number
  }],
  // Locations visited
  locations: [{
    name: String,
    visitCount: Number
  }],
  // Generated receipt image URL
  receiptImageUrl: String,
  // Fun facts / insights
  insights: [{
    type: {
      type: String,
      enum: ['achievement', 'pattern', 'comparison', 'milestone']
    },
    title: String,
    description: String,
    icon: String
  }],
  // Sharing
  isShared: {
    type: Boolean,
    default: false
  },
  shareToken: String,
  // User has viewed this receipt
  viewedAt: Date
}, {
  timestamps: true
});

// Compound index for efficient lookups
WeeklyReceiptSchema.index({ userId: 1, year: 1, weekNumber: 1 }, { unique: true });
WeeklyReceiptSchema.index({ userId: 1, createdAt: -1 });

// Get receipt by week
WeeklyReceiptSchema.statics.getByWeek = function(userId, year, weekNumber) {
  return this.findOne({ userId, year, weekNumber });
};

// Get all receipts for a user
WeeklyReceiptSchema.statics.getAllForUser = function(userId, limit = 52) {
  return this.find({ userId })
    .sort({ year: -1, weekNumber: -1 })
    .limit(limit);
};

module.exports = mongoose.model('WeeklyReceipt', WeeklyReceiptSchema);
