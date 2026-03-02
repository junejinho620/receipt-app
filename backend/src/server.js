require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');

const connectDB = require('./config/database');
const ReceiptGenerator = require('./services/receiptGenerator');
const { User, Entry, WeeklyReceipt } = require('./models');

// Import routes
const entriesRoutes = require('./routes/entries');
const calendarRoutes = require('./routes/calendar');
const receiptsRoutes = require('./routes/receipts');
const usersRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to database
connectDB();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/entries', entriesRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/receipts', receiptsRoutes);
app.use('/api/users', usersRoutes);

// User routes (basic auth endpoints)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists'
      });
    }

    // In production, hash the password
    // const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({
      email,
      username,
      passwordHash: password // TODO: Hash in production
    });

    await user.save();

    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        username: user.username,
        // In production, return JWT token
        token: user._id.toString()
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // In production, compare hashed password
    // const isMatch = await bcrypt.compare(password, user.passwordHash);
    const isMatch = password === user.passwordHash;

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        username: user.username,
        profile: user.profile,
        stats: user.stats,
        // In production, return JWT token
        token: user._id.toString()
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

// Get user profile
app.get('/api/auth/me', require('./middleware/auth'), async (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.user._id,
      email: req.user.email,
      username: req.user.username,
      profile: req.user.profile,
      preferences: req.user.preferences,
      stats: req.user.stats
    }
  });
});

// Get user data stats for Privacy Screen
app.get('/api/auth/me/stats', require('./middleware/auth'), async (req, res) => {
  try {
    const userId = req.user._id;
    const totalLogs = await Entry.countDocuments({ userId });
    const totalReports = await WeeklyReceipt.countDocuments({ userId });

    // Calculate a rough "media size" based on logs to show on the receipt
    const entries = await Entry.find({ userId }).select('media');
    let totalMediaItems = 0;
    entries.forEach(entry => {
      if (entry.media) totalMediaItems += entry.media.length;
    });

    // Faux calculation for bytes: Assume ~3.2MB per media item, ~2KB per log, ~5KB per report
    const estimatedBytes = (totalMediaItems * 3200000) + (totalLogs * 2000) + (totalReports * 5000);
    const mbSize = (estimatedBytes / (1024 * 1024)).toFixed(1);

    res.json({
      success: true,
      data: {
        totalLogs,
        totalReports,
        totalMediaItems,
        totalSizeMB: parseFloat(mbSize) || 0.1,
        accountAgeDays: Math.max(1, Math.floor((Date.now() - new Date(req.user.createdAt).getTime()) / (1000 * 60 * 60 * 24)))
      }
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user stats' });
  }
});

// Update user profile
app.put('/api/auth/me', require('./middleware/auth'), async (req, res) => {
  try {
    const { profile, preferences } = req.body;

    if (profile) {
      Object.assign(req.user.profile, profile);
    }

    if (preferences) {
      Object.assign(req.user.preferences, preferences);
    }

    await req.user.save();

    res.json({
      success: true,
      data: {
        id: req.user._id,
        email: req.user.email,
        username: req.user.username,
        profile: req.user.profile,
        preferences: req.user.preferences
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

// Scheduled task: Generate weekly receipts every Sunday at midnight
cron.schedule('0 0 * * 0', async () => {
  console.log('Running weekly receipt generation...');

  try {
    const users = await User.find({
      'preferences.weeklyReceipt.enabled': true,
      isActive: true
    });

    const now = new Date();
    const year = now.getFullYear();
    const weekNumber = getWeekNumber(now) - 1; // Previous week

    for (const user of users) {
      try {
        const generator = new ReceiptGenerator(user._id, year, weekNumber);
        await generator.generate();
        console.log(`Generated receipt for user ${user._id}`);
      } catch (err) {
        console.error(`Failed to generate receipt for user ${user._id}:`, err);
      }
    }

    console.log('Weekly receipt generation completed');
  } catch (error) {
    console.error('Weekly receipt generation error:', error);
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════╗
  ║                                               ║
  ║   🧾 The Receipt API Server                   ║
  ║   Running on port ${PORT}                        ║
  ║                                               ║
  ║   Endpoints:                                  ║
  ║   - POST /api/entries     (create entry)      ║
  ║   - GET  /api/entries     (list entries)      ║
  ║   - GET  /api/calendar    (calendar view)     ║
  ║   - GET  /api/receipts    (weekly receipts)   ║
  ║                                               ║
  ╚═══════════════════════════════════════════════╝
  `);
});

module.exports = app;
