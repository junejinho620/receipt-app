const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  passwordHash: {
    type: String,
    required: true
  },
  profile: {
    displayName: String,
    avatar: String,
    bio: String,
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  preferences: {
    // Daily reminder settings
    dailyReminder: {
      enabled: { type: Boolean, default: true },
      time: { type: String, default: '21:00' } // 9 PM default
    },
    // Weekly receipt settings
    weeklyReceipt: {
      enabled: { type: Boolean, default: true },
      dayOfWeek: { type: Number, default: 0 } // 0 = Sunday
    },
    // Theme
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    }
  },
  stats: {
    totalEntries: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastEntryDate: Date
  },
  // Connected services for music import
  connectedServices: {
    spotify: {
      connected: { type: Boolean, default: false },
      accessToken: String,
      refreshToken: String,
      expiresAt: Date
    },
    appleMusic: {
      connected: { type: Boolean, default: false },
      musicUserToken: String
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Update streak on new entry
UserSchema.methods.updateStreak = async function(entryDate) {
  const today = new Date(entryDate);
  today.setHours(0, 0, 0, 0);

  if (this.stats.lastEntryDate) {
    const lastEntry = new Date(this.stats.lastEntryDate);
    lastEntry.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((today - lastEntry) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Consecutive day
      this.stats.currentStreak += 1;
    } else if (diffDays > 1) {
      // Streak broken
      this.stats.currentStreak = 1;
    }
    // diffDays === 0 means same day, don't change streak
  } else {
    this.stats.currentStreak = 1;
  }

  if (this.stats.currentStreak > this.stats.longestStreak) {
    this.stats.longestStreak = this.stats.currentStreak;
  }

  this.stats.lastEntryDate = entryDate;
  this.stats.totalEntries += 1;

  await this.save();
};

module.exports = mongoose.model('User', UserSchema);
