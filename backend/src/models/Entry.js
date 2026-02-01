const mongoose = require('mongoose');

const MediaSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['image', 'video', 'music'],
    required: true
  },
  url: {
    type: String,
    required: true
  },
  thumbnail: String,
  duration: Number, // for video/music in seconds
  metadata: {
    width: Number,
    height: Number,
    fileSize: Number,
    mimeType: String,
    // Music specific
    title: String,
    artist: String,
    album: String
  }
}, { _id: true });

const EntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  // Text content
  text: {
    type: String,
    maxlength: 5000
  },
  // Emoji of the day / mood
  emoji: {
    type: String,
    maxlength: 50
  },
  mood: {
    type: String,
    enum: ['amazing', 'good', 'okay', 'bad', 'terrible'],
  },
  // Media attachments
  media: [MediaSchema],
  // Tags for easier searching
  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  // Location (optional)
  location: {
    name: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  // Weather at time of entry
  weather: {
    condition: String,
    temperature: Number,
    icon: String
  },
  // Privacy
  isPrivate: {
    type: Boolean,
    default: true
  },
  // For weekly receipt inclusion
  highlightScore: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound index for efficient calendar queries
EntrySchema.index({ userId: 1, date: -1 });
EntrySchema.index({ userId: 1, createdAt: -1 });

// Get entries for a specific date range
EntrySchema.statics.getByDateRange = function(userId, startDate, endDate) {
  return this.find({
    userId,
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ date: -1 });
};

// Get entries for calendar view (grouped by date)
EntrySchema.statics.getCalendarData = async function(userId, year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const entries = await this.find({
    userId,
    date: { $gte: startDate, $lte: endDate }
  }).select('date emoji mood media text');

  // Group by day
  const calendar = {};
  entries.forEach(entry => {
    const day = entry.date.getDate();
    if (!calendar[day]) {
      calendar[day] = [];
    }
    calendar[day].push({
      id: entry._id,
      emoji: entry.emoji,
      mood: entry.mood,
      hasMedia: entry.media.length > 0,
      hasText: !!entry.text,
      preview: entry.text ? entry.text.substring(0, 50) : null
    });
  });

  return calendar;
};

module.exports = mongoose.model('Entry', EntrySchema);
