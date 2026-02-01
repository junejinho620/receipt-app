const { Entry, WeeklyReceipt, User } = require('../models');

class ReceiptGenerator {
  constructor(userId, year, weekNumber) {
    this.userId = userId;
    this.year = year;
    this.weekNumber = weekNumber;
  }

  // Calculate week date range
  getWeekRange() {
    const startDate = new Date(this.year, 0, 1);
    const dayOfWeek = startDate.getDay();
    const diff = (this.weekNumber - 1) * 7 - dayOfWeek;
    startDate.setDate(startDate.getDate() + diff);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);

    return { startDate, endDate };
  }

  // Generate the weekly receipt
  async generate() {
    const { startDate, endDate } = this.getWeekRange();

    // Fetch all entries for the week
    const entries = await Entry.find({
      userId: this.userId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    if (entries.length === 0) {
      return null; // No entries, no receipt
    }

    // Calculate stats
    const stats = this.calculateStats(entries);

    // Analyze moods
    const moodSummary = this.analyzeMoods(entries);

    // Get top emojis
    const topEmojis = this.getTopEmojis(entries);

    // Select highlights
    const highlights = this.selectHighlights(entries);

    // Extract top songs
    const topSongs = this.extractTopSongs(entries);

    // Generate word cloud data
    const topWords = this.extractTopWords(entries);

    // Get top tags
    const topTags = this.getTopTags(entries);

    // Get locations
    const locations = this.getLocations(entries);

    // Generate insights
    const insights = await this.generateInsights(entries, stats);

    // Create or update receipt
    const receipt = await WeeklyReceipt.findOneAndUpdate(
      {
        userId: this.userId,
        year: this.year,
        weekNumber: this.weekNumber
      },
      {
        userId: this.userId,
        year: this.year,
        weekNumber: this.weekNumber,
        startDate,
        endDate,
        stats,
        moodSummary,
        topEmojis,
        highlights,
        topSongs,
        topWords,
        topTags,
        locations,
        insights
      },
      { upsert: true, new: true }
    );

    return receipt;
  }

  // Calculate basic stats
  calculateStats(entries) {
    const stats = {
      totalEntries: entries.length,
      totalPhotos: 0,
      totalVideos: 0,
      totalSongs: 0,
      totalWords: 0,
      daysActive: new Set(),
      streakMaintained: false
    };

    entries.forEach(entry => {
      // Count media types
      entry.media.forEach(m => {
        if (m.type === 'image') stats.totalPhotos++;
        if (m.type === 'video') stats.totalVideos++;
        if (m.type === 'music') stats.totalSongs++;
      });

      // Count words
      if (entry.text) {
        stats.totalWords += entry.text.split(/\s+/).filter(w => w.length > 0).length;
      }

      // Track unique days
      stats.daysActive.add(entry.date.toDateString());
    });

    stats.daysActive = stats.daysActive.size;
    stats.streakMaintained = stats.daysActive === 7;

    return stats;
  }

  // Analyze mood distribution
  analyzeMoods(entries) {
    const moodScores = {
      amazing: 5,
      good: 4,
      okay: 3,
      bad: 2,
      terrible: 1
    };

    const distribution = {
      amazing: 0,
      good: 0,
      okay: 0,
      bad: 0,
      terrible: 0
    };

    let totalScore = 0;
    let moodCount = 0;

    entries.forEach(entry => {
      if (entry.mood && distribution.hasOwnProperty(entry.mood)) {
        distribution[entry.mood]++;
        totalScore += moodScores[entry.mood];
        moodCount++;
      }
    });

    // Find dominant mood
    let dominantMood = 'okay';
    let maxCount = 0;
    Object.entries(distribution).forEach(([mood, count]) => {
      if (count > maxCount) {
        maxCount = count;
        dominantMood = mood;
      }
    });

    return {
      dominantMood,
      moodDistribution: distribution,
      averageMoodScore: moodCount > 0 ? (totalScore / moodCount).toFixed(2) : null
    };
  }

  // Get top emojis used
  getTopEmojis(entries) {
    const emojiCount = {};

    entries.forEach(entry => {
      if (entry.emoji) {
        // Split emoji string in case multiple emojis
        const emojis = [...entry.emoji];
        emojis.forEach(e => {
          emojiCount[e] = (emojiCount[e] || 0) + 1;
        });
      }
    });

    return Object.entries(emojiCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([emoji, count]) => ({ emoji, count }));
  }

  // Select highlight entries
  selectHighlights(entries) {
    const highlights = [];

    // Sort by highlight score or media count
    const sorted = [...entries].sort((a, b) => {
      const scoreA = a.highlightScore + a.media.length * 2 + (a.text ? a.text.length / 100 : 0);
      const scoreB = b.highlightScore + b.media.length * 2 + (b.text ? b.text.length / 100 : 0);
      return scoreB - scoreA;
    });

    // Take top 5 highlights
    sorted.slice(0, 5).forEach(entry => {
      if (entry.media.length > 0) {
        const media = entry.media[0];
        highlights.push({
          entryId: entry._id,
          type: media.type === 'image' ? 'photo' : media.type,
          preview: entry.text ? entry.text.substring(0, 100) : null,
          mediaUrl: media.url
        });
      } else if (entry.text) {
        highlights.push({
          entryId: entry._id,
          type: 'text',
          preview: entry.text.substring(0, 200),
          mediaUrl: null
        });
      }
    });

    return highlights;
  }

  // Extract top songs
  extractTopSongs(entries) {
    const songs = [];

    entries.forEach(entry => {
      entry.media.forEach(m => {
        if (m.type === 'music' && m.metadata) {
          songs.push({
            title: m.metadata.title || 'Unknown',
            artist: m.metadata.artist || 'Unknown',
            playCount: 1,
            albumArt: m.thumbnail || null
          });
        }
      });
    });

    // Aggregate by title + artist
    const songMap = {};
    songs.forEach(song => {
      const key = `${song.title}-${song.artist}`;
      if (songMap[key]) {
        songMap[key].playCount++;
      } else {
        songMap[key] = song;
      }
    });

    return Object.values(songMap)
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, 5);
  }

  // Extract top words for word cloud
  extractTopWords(entries) {
    const wordCount = {};
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
      'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought',
      'used', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which',
      'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are', 'was',
      'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do',
      'does', 'did', 'doing', 'my', 'your', 'his', 'her', 'its', 'our', 'their',
      'me', 'him', 'her', 'us', 'them', 'just', 'so', 'than', 'too', 'very',
      'now', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each',
      'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
      'not', 'only', 'same', 'then', 'also', 'back', 'after', 'before', 'because'
    ]);

    entries.forEach(entry => {
      if (entry.text) {
        const words = entry.text.toLowerCase()
          .replace(/[^\w\s]/g, '')
          .split(/\s+/)
          .filter(w => w.length > 2 && !stopWords.has(w));

        words.forEach(word => {
          wordCount[word] = (wordCount[word] || 0) + 1;
        });
      }
    });

    return Object.entries(wordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word, count]) => ({ word, count }));
  }

  // Get top tags
  getTopTags(entries) {
    const tagCount = {};

    entries.forEach(entry => {
      entry.tags.forEach(tag => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    });

    return Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));
  }

  // Get locations
  getLocations(entries) {
    const locationCount = {};

    entries.forEach(entry => {
      if (entry.location && entry.location.name) {
        const name = entry.location.name;
        locationCount[name] = (locationCount[name] || 0) + 1;
      }
    });

    return Object.entries(locationCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, visitCount]) => ({ name, visitCount }));
  }

  // Generate insights
  async generateInsights(entries, stats) {
    const insights = [];

    // Streak achievement
    if (stats.daysActive === 7) {
      insights.push({
        type: 'achievement',
        title: 'Perfect Week! 🌟',
        description: 'You documented every single day this week!',
        icon: 'star'
      });
    }

    // Photo milestone
    if (stats.totalPhotos >= 10) {
      insights.push({
        type: 'milestone',
        title: 'Shutterbug 📸',
        description: `You captured ${stats.totalPhotos} photos this week!`,
        icon: 'camera'
      });
    }

    // Writing pattern
    if (stats.totalWords >= 500) {
      insights.push({
        type: 'pattern',
        title: 'Wordsmith ✍️',
        description: `You wrote ${stats.totalWords} words this week. That's a lot of thoughts!`,
        icon: 'pencil'
      });
    }

    // Music lover
    if (stats.totalSongs >= 5) {
      insights.push({
        type: 'pattern',
        title: 'Music Lover 🎵',
        description: `${stats.totalSongs} songs made it into your memories this week`,
        icon: 'music'
      });
    }

    // Compare to previous week
    const prevWeek = this.weekNumber > 1 ? this.weekNumber - 1 : 52;
    const prevYear = this.weekNumber > 1 ? this.year : this.year - 1;
    const prevReceipt = await WeeklyReceipt.findOne({
      userId: this.userId,
      year: prevYear,
      weekNumber: prevWeek
    });

    if (prevReceipt) {
      const entryDiff = stats.totalEntries - prevReceipt.stats.totalEntries;
      if (entryDiff > 0) {
        insights.push({
          type: 'comparison',
          title: 'More Active! 📈',
          description: `${entryDiff} more entries than last week!`,
          icon: 'trending-up'
        });
      }
    }

    return insights;
  }
}

module.exports = ReceiptGenerator;
