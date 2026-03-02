import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import multer from 'multer';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const app = express();
const prisma = new PrismaClient({ adapter });
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads/'));
  },
  filename: (req, file, cb) => {
    // Generate a unique filename: timestamp-random.ext
    const ext = path.extname(file.originalname) || '.jpg';
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + ext;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// Media Upload Endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    // req.get('host') dynamically gets the local IP/port the requester used (e.g. 192.168.1.100:3000)
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ success: true, url: fileUrl });
  } catch (error: any) {
    console.error('Upload Error:', error);
    res.status(500).json({ success: false, error: 'Server error during upload' });
  }
});

// ----------------------------------------------------
// AUTHENTICATION
// ----------------------------------------------------
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_dev_key';

// Middleware to protect routes
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ success: false, error: 'Access token missing' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ success: false, error: 'Invalid token' });
    req.user = user;
    next();
  });
};

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, username, password, avatarUrl, selectedTitle } = req.body;

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = await prisma.user.create({
      data: { email, username, passwordHash, avatarUrl, selectedTitle }
    });

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ success: true, token, data: user });
  } catch (error: any) {
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] ?? 'email or username';
      return res.status(409).json({ success: false, error: `An account with that ${field} already exists. Please sign in instead.` });
    }
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // Find user by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email || '' },
          { username: username || '' }
        ]
      }
    });

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ success: true, token, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ----------------------------------------------------
// USERS PROFILES
// ----------------------------------------------------

// GET /api/users/profile — authenticated user's profile + streak stats
app.get('/api/users/profile', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { achievements: true }
    });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    // Compute streak from logs sorted by date desc
    const logs = await prisma.log.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      select: { date: true }
    });
    const totalEntries = logs.length;
    let currentStreak = 0;
    let longestStreak = 0;
    if (logs.length > 0) {
      let today = req.query.localDate as string;
      if (!today) {
        today = new Date().toISOString().split('T')[0] || '';
      }

      // 1. Calculate Yesterday Safely
      const todayDateObj = new Date(today);
      todayDateObj.setUTCHours(0, 0, 0, 0);
      const yesterdayDateObj = new Date(todayDateObj);
      yesterdayDateObj.setUTCDate(yesterdayDateObj.getUTCDate() - 1);
      const yesterday = yesterdayDateObj.toISOString().split('T')[0];

      // 2. Identify Current Streak
      const mostRecentLogDate = logs[0]?.date || '';
      if (mostRecentLogDate !== today && mostRecentLogDate !== yesterday) {
        currentStreak = 0; // Streak broken
      } else {
        let streak = 0;
        let checkDate = mostRecentLogDate;
        for (const log of logs) {
          if (log.date === checkDate) {
            streak++;
            const prev = new Date(checkDate);
            prev.setUTCHours(0, 0, 0, 0);
            prev.setUTCDate(prev.getUTCDate() - 1);
            checkDate = prev.toISOString().split('T')[0] || '';
          } else {
            break;
          }
        }
        currentStreak = streak;
      }

      // 3. Simple Longest Streak Calculation
      let tempStreak = 1;
      const sortedDates = logs.map(l => l.date).sort();
      for (let i = 1; i < sortedDates.length; i++) {
        const prev = new Date(sortedDates[i - 1]!);
        const curr = new Date(sortedDates[i]!);
        const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
        if (Math.round(diff) === 1) {
          tempStreak++;
          longestStreak = Math.max(longestStreak, tempStreak);
        } else {
          tempStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, currentStreak, 1);
    }

    // XP & Level Engine
    const XP_PER_LOG = 20;
    const XP_PER_STREAK_DAY = 5;
    const totalXp = (totalEntries * XP_PER_LOG) + (longestStreak * XP_PER_STREAK_DAY);
    const level = Math.floor(Math.sqrt(totalXp / 100)) + 1;
    const currentLevelBaseXp = Math.pow(level - 1, 2) * 100;
    const nextLevelBaseXp = Math.pow(level, 2) * 100;
    const levelProgress = totalXp === 0 ? 0 : (totalXp - currentLevelBaseXp) / (nextLevelBaseXp - currentLevelBaseXp);

    res.json({
      success: true,
      data: {
        id: user.id, username: user.username, email: user.email,
        avatarUrl: user.avatarUrl, selectedTitle: user.selectedTitle,
        achievements: user.achievements,
        stats: { currentStreak, longestStreak, totalEntries, totalXp },
        level, levelProgress
      }
    });
  } catch (error: any) {
    console.error('PROFILE FETCH ERROR:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/users/:id - Must be handled after /api/users/profile
app.get('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: { logs: true, weeklyReports: true }
        }
      }
    });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/users/profile — update username, email, password
app.put('/api/users/profile', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { username, email, currentPassword, newPassword, selectedTitle } = req.body;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const updateData: any = {};

    if (selectedTitle !== undefined) {
      updateData.selectedTitle = selectedTitle;
    }

    if (username && username !== user.username) {
      const trimmed = username.trim();
      if (trimmed.length < 3 || trimmed.length > 30)
        return res.status(400).json({ success: false, error: 'Username must be 3-30 characters' });
      const exists = await prisma.user.findFirst({ where: { username: trimmed, NOT: { id: userId } } });
      if (exists) return res.status(400).json({ success: false, error: 'That username is already taken' });
      updateData.username = trimmed;
    }

    if (email && email !== user.email) {
      const exists = await prisma.user.findFirst({ where: { email, NOT: { id: userId } } });
      if (exists) return res.status(400).json({ success: false, error: 'Email is already in use' });
      updateData.email = email;
    }

    if (newPassword) {
      if (!currentPassword)
        return res.status(400).json({ success: false, error: 'Current password is required' });
      const match = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!match) return res.status(401).json({ success: false, error: 'Current password is incorrect' });
      updateData.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    if (Object.keys(updateData).length === 0)
      return res.json({ success: true, data: user });

    const updated = await prisma.user.update({ where: { id: userId }, data: updateData });
    res.json({ success: true, data: { id: updated.id, username: updated.username, email: updated.email, avatarUrl: updated.avatarUrl, selectedTitle: updated.selectedTitle } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/users/avatar — store base64-encoded avatar in avatarUrl
app.put('/api/users/avatar', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { avatarDataUrl } = req.body;
    if (!avatarDataUrl) return res.status(400).json({ success: false, error: 'No avatar data provided' });

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: avatarDataUrl }
    });
    res.json({ success: true, data: { avatarUrl: updated.avatarUrl } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/users/profile/stats — privacy footprint stats
app.get('/api/users/profile/stats', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: { logs: true, weeklyReports: true }
        },
        logs: {
          select: { photoUrl: true }
        }
      }
    });

    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const totalLogs = user._count.logs;
    const totalReports = user._count.weeklyReports;

    // Count media items (both avatar and photos attached to logs)
    let totalMediaItems = user.avatarUrl ? 1 : 0;
    for (const log of user.logs) {
      if (log.photoUrl) totalMediaItems++;
    }

    // Rough size estimate (obviously fake sizes based on counts)
    const baseSize = 0.5; // Base profile JSON
    const logSizeMB = totalLogs * 0.05; // 50KB per text log
    const mediaSizeMB = totalMediaItems * 2.5; // 2.5MB per media item
    const totalSizeMB = parseFloat((baseSize + logSizeMB + mediaSizeMB).toFixed(2));

    const createdDate = new Date(user.createdAt);
    const today = new Date();
    const ageMs = today.getTime() - createdDate.getTime();
    const accountAgeDays = Math.max(1, Math.floor(ageMs / (1000 * 60 * 60 * 24)));

    res.json({
      success: true,
      data: {
        totalLogs,
        totalReports,
        totalMediaItems,
        totalSizeMB,
        accountAgeDays
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/users/profile — delete user account ("Shred Receipt")
app.delete('/api/users/profile', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    // Prisma cascades usually handled via schema, but we do manual just in case 
    // unless schema supports onDelete: Cascade (which it doesn't currently)
    await prisma.log.deleteMany({ where: { userId } });
    await prisma.weeklyReport.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });

    res.json({ success: true, message: 'Account shredded' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ----------------------------------------------------
// LOGS (RECEIPTS)
// ----------------------------------------------------
app.post('/api/logs', async (req, res) => {
  try {
    const { userId, date, title, location, inputType, content, photoUrl, musicTitle, musicArtist, musicArtwork } = req.body;
    const log = await prisma.log.create({
      data: { userId, date, title, location, inputType, content, photoUrl, musicTitle, musicArtist, musicArtwork }
    });

    // BACKGROUND ACHIEVEMENT CHECK 
    const newlyUnlocked: string[] = [];
    try {
      const userLogsCount = await prisma.log.count({ where: { userId } });

      const unlockAchievement = async (titleId: string) => {
        const exists = await prisma.achievement.findUnique({
          where: { userId_titleId: { userId, titleId } }
        });
        if (!exists) {
          await prisma.achievement.create({ data: { userId, titleId } });
          newlyUnlocked.push(titleId);
        }
      };

      if (userLogsCount >= 1) await unlockAchievement("first_ledger");
      if (userLogsCount >= 10) await unlockAchievement("steadfast_auditor");
      if (userLogsCount >= 50) await unlockAchievement("receipt_master");

      const logDateObj = new Date(log.createdAt);
      const logHour = logDateObj.getHours();

      if (logHour >= 4 && logHour <= 8) await unlockAchievement("early_bird");
      if (logHour >= 0 && logHour < 4) await unlockAchievement("night_owl");
      if (logDateObj.getDay() === 0) await unlockAchievement("sunday_scaries");

      if (log.photoUrl) await unlockAchievement("aesthetic_auditor");
      if (log.musicTitle) await unlockAchievement("soundtrack");
      if (log.inputType === 'Emoji') await unlockAchievement("expressive");

      const logs = await prisma.log.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        select: { date: true }
      });
      if (logs.length >= 7) {
        let streak = 0;
        let checkDate = logs[0]?.date || '';
        for (const l of logs) {
          if (l.date === checkDate) {
            streak++;
            const prev = new Date(checkDate);
            prev.setUTCHours(0, 0, 0, 0);
            prev.setUTCDate(prev.getUTCDate() - 1);
            checkDate = prev.toISOString().split('T')[0] || '';
          } else {
            break;
          }
        }
        if (streak >= 7) await unlockAchievement("weekly_warrior");
      }

    } catch (achError) {
      console.error("Failed to unlock achievement", achError);
    }

    res.json({ success: true, newlyUnlocked, data: log });
  } catch (error: any) {
    // Usually fails if (userId, date) isn't unique, because they already logged today
    res.status(400).json({ success: false, error: 'You have already filed a receipt for today.' });
  }
});

app.get('/api/logs/:userId/:date', async (req, res) => {
  try {
    const { userId, date } = req.params;
    const log = await prisma.log.findUnique({
      where: {
        userId_date: { userId, date } // This requires the unique composite key from schema!
      }
    });
    res.json({ success: true, data: log }); // null if they haven't logged today
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/logs/:userId/month/:yearMonth', async (req, res) => {
  try {
    // yearMonth like "2023-01". We want to return all logs that startWith this.
    const { userId, yearMonth } = req.params;
    const logs = await prisma.log.findMany({
      where: {
        userId: userId,
        date: {
          startsWith: yearMonth
        }
      }
    });
    res.json({ success: true, data: logs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ----------------------------------------------------
// WEEKLY REPORTS & MONTAGES
// ----------------------------------------------------
app.post('/api/reports/generate', async (req, res) => {
  try {
    const { userId, weekLabel, dateRange, startDate, endDate, subtitle } = req.body;

    // First, count how many receipts exist in this date range
    // The dates are stored as 'YYYY-MM-DD' strings in our simplified schema.
    const runDates = await prisma.log.findMany({
      where: {
        userId: userId as string,
        date: {
          gte: startDate as string,
          lte: endDate as string,
        },
      },
      select: { date: true }
    });

    const uniqueDays = new Set(runDates.map(l => l.date));
    const totalReceipts = uniqueDays.size;

    const report = await prisma.weeklyReport.create({
      data: {
        userId,
        weekLabel,
        dateRange,
        startDate: new Date(startDate), // Converting to JS Date for the DB if needed
        endDate: new Date(endDate),
        subtitle: subtitle || `Compiled ${totalReceipts} logs this week.`,
        totalReceipts
      }
    });

    res.json({ success: true, data: report });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/reports/:userId', async (req, res) => {
  try {
    const reports = await prisma.weeklyReport.findMany({
      where: { userId: req.params.userId },
      orderBy: { startDate: 'desc' }
    });
    res.json({ success: true, data: reports });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/reports/:reportId/montage', async (req, res) => {
  try {
    const report = await prisma.weeklyReport.findUnique({
      where: { id: req.params.reportId }
    });

    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    // Convert Date objects back to 'YYYY-MM-DD' if necessary to query logs
    const startStr = report.startDate.toISOString().split('T')[0];
    const endStr = report.endDate.toISOString().split('T')[0];

    const logs = await prisma.log.findMany({
      where: {
        userId: report.userId,
        date: {
          gte: startStr as string,
          lte: endStr as string,
        }
      },
      orderBy: { date: 'asc' }
    });

    res.json({ success: true, data: { report, logs } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/health', async (req, res) => {
  try {
    // Check if DB is alive
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      db: 'connected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      db: 'disconnected',
      timestamp: new Date().toISOString()
    });
  }
});

app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════╗
  ║                                               ║
  ║   🧾 The Receipt API Server                   ║
  ║   Running on port ${PORT}                        ║
  ║                                               ║
  ║   Prisma DB: Connected                        ║
  ║                                               ║
  ╚═══════════════════════════════════════════════╝
  `);
});

export default app;
