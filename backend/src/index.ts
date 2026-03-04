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
import { rateLimit } from 'express-rate-limit';
import sharp from 'sharp';
import { z, ZodSchema } from 'zod';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const app = express();
const prisma = new PrismaClient({ adapter });
const PORT = process.env.PORT || 3000;

// ---- Zod Validation Schemas ----
const SignupSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(30).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z.string().min(8, 'Password must be at least 8 characters').regex(/[A-Za-z]/, 'Password must contain at least one letter').regex(/[0-9]/, 'Password must contain at least one number'),
});

const LoginSchema = z.object({
  email: z.string().optional(),
  username: z.string().optional(),
  password: z.string().min(1, 'Password is required'),
}).refine(data => data.email || data.username, { message: 'Email or username is required' });

const ProfileUpdateSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).optional(),
  email: z.string().email().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional(),
  selectedTitle: z.string().optional(),
  avatarUrl: z.string().optional(),
});

const LogCreateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  title: z.string().max(100).optional(),
  location: z.string().max(200).optional(),
  inputType: z.enum(['Text', 'Photo', 'Emoji']),
  content: z.string().max(5000).optional(),
  photoUrl: z.string().url().optional().or(z.literal('')),
  musicTitle: z.string().max(200).optional(),
  musicArtist: z.string().max(200).optional(),
  musicArtwork: z.string().optional(),
});

// ---- Validation Middleware ----
const validateBody = (schema: ZodSchema) => (req: any, res: any, next: any) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: result.error.issues[0]?.message || 'Invalid request body',
      details: result.error.issues.map((e: z.ZodIssue) => ({ field: e.path.join('.'), message: e.message }))
    });
  }
  req.body = result.data;
  next();
};

// ---- Rate Limiters ----
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again after 15 minutes.' }
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: { success: false, error: 'Too many uploads, please slow down.' }
});

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Configure Multer storage
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

const storage = multer.memoryStorage(); // Use memory storage so we can compress with sharp
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Only JPEG, PNG, WebP and HEIC are allowed.`));
    }
  }
});

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Media Upload Endpoint — with sharp compression
app.post('/api/upload', uploadLimiter, upload.single('file'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const ext = '.webp'; // Normalize all uploads to WebP for size efficiency
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + ext;
    const outputPath = path.join(uploadsDir, uniqueName);

    // Compress and convert to WebP (max 1200px wide, 80% quality)
    await sharp(req.file.buffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(outputPath);

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${uniqueName}`;
    res.json({ success: true, url: fileUrl });
  } catch (error: any) {
    console.error('Upload Error:', error);
    const status = error.message?.includes('Unsupported file type') ? 415 : 500;
    res.status(status).json({ success: false, error: error.message || 'Server error during upload' });
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

app.post('/api/auth/signup', authLimiter, validateBody(SignupSchema), async (req, res) => {
  try {
    const { email, username, password, avatarUrl, selectedTitle } = req.body;

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = await prisma.user.create({
      data: { email: email.toLowerCase().trim(), username: username.trim(), passwordHash, avatarUrl, selectedTitle }
    });

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ success: true, token, data: { id: user.id, email: user.email, username: user.username, avatarUrl: user.avatarUrl, selectedTitle: user.selectedTitle } });
  } catch (error: any) {
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] ?? 'email or username';
      return res.status(409).json({ success: false, error: `An account with that ${field} already exists. Please sign in instead.` });
    }
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/api/auth/login', authLimiter, validateBody(LoginSchema), async (req, res) => {
  try {
    const { email, username, password } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: (email || '').toLowerCase().trim() },
          { username: (username || '').trim() }
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
    res.json({ success: true, token, data: { id: user.id, email: user.email, username: user.username, avatarUrl: user.avatarUrl, selectedTitle: user.selectedTitle } });
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
app.put('/api/users/profile', authenticateToken, validateBody(ProfileUpdateSchema), async (req: any, res) => {
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
app.post('/api/logs', authenticateToken, validateBody(LogCreateSchema), async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { date, title, location, inputType, content, photoUrl, musicTitle, musicArtist, musicArtwork } = req.body;
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
// ----------------------------------------------------
// FRIENDS & ACCOUNTABILITY
// ----------------------------------------------------

app.get('/api/friends/search', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const query = req.query.q as string;
    if (!query || query.trim().length < 3) {
      return res.json({ success: true, data: [] });
    }

    const users = await prisma.user.findMany({
      where: {
        username: { contains: query, mode: 'insensitive' },
        NOT: { id: userId }
      },
      select: { id: true, username: true, avatarUrl: true, selectedTitle: true }
    });

    const results = await Promise.all(users.map(async (u) => {
      const existing = await prisma.friendship.findFirst({
        where: {
          OR: [
            { userId, friendId: u.id },
            { userId: u.id, friendId: userId }
          ]
        }
      });
      return { ...u, friendshipStatus: existing?.status || 'none', senderId: existing?.userId };
    }));

    res.json({ success: true, data: results });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/friends/request', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { friendId } = req.body;

    if (userId === friendId) return res.status(400).json({ success: false, error: 'Cannot friend yourself' });

    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [{ userId, friendId }, { userId: friendId, friendId: userId }]
      }
    });

    if (existing) return res.status(400).json({ success: false, error: 'Friendship or request already exists' });

    const friendship = await prisma.friendship.create({
      data: { userId, friendId, status: 'pending' }
    });

    res.json({ success: true, data: friendship });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/friends/accept', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { friendshipId, accept } = req.body; // accept is boolean

    const friendship = await prisma.friendship.findUnique({ where: { id: friendshipId } });
    if (!friendship || friendship.friendId !== userId) {
      return res.status(403).json({ success: false, error: 'Invalid request' });
    }

    if (accept) {
      const updated = await prisma.friendship.update({
        where: { id: friendshipId },
        data: { status: 'accepted' }
      });
      res.json({ success: true, data: updated });
    } else {
      await prisma.friendship.delete({ where: { id: friendshipId } });
      res.json({ success: true, message: 'Request denied' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/friends/feed', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ userId, status: 'accepted' }, { friendId: userId, status: 'accepted' }]
      },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true, selectedTitle: true } },
        friend: { select: { id: true, username: true, avatarUrl: true, selectedTitle: true } }
      }
    });

    const pendingRequests = await prisma.friendship.findMany({
      where: { friendId: userId, status: 'pending' },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true, selectedTitle: true } }
      }
    });

    let today = req.query.localDate as string;
    if (!today) today = new Date().toISOString().split('T')[0] || '';

    const todayDateObj = new Date(today);
    todayDateObj.setUTCHours(0, 0, 0, 0);
    const yesterdayDateObj = new Date(todayDateObj);
    yesterdayDateObj.setUTCDate(yesterdayDateObj.getUTCDate() - 1);
    const yesterday = yesterdayDateObj.toISOString().split('T')[0];

    const feedPromises = friendships.map(async (f) => {
      const isSender = f.userId === userId;
      const friendProfile = isSender ? f.friend : f.user;

      const logs = await prisma.log.findMany({
        where: { userId: friendProfile.id },
        orderBy: { date: 'desc' },
        select: { date: true }
      });

      let currentStreak = 0;
      let hasSettledToday = false;
      const totalEntries = logs.length;

      if (totalEntries > 0) {
        const mostRecentLogDate = logs[0]?.date || '';
        if (mostRecentLogDate === today) hasSettledToday = true;

        if (mostRecentLogDate === today || mostRecentLogDate === yesterday) {
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
      }

      let longestStreak = 0;
      let tempStreak = 1;
      if (totalEntries > 0) {
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

      const XP_PER_LOG = 20;
      const XP_PER_STREAK_DAY = 5;
      const totalXp = (totalEntries * XP_PER_LOG) + (longestStreak * XP_PER_STREAK_DAY);
      const level = Math.floor(Math.sqrt(totalXp / 100)) + 1;

      let todayLog = null;
      if (hasSettledToday) {
        todayLog = await prisma.log.findFirst({
          where: { userId: friendProfile.id, date: today },
          select: {
            id: true,
            inputType: true,
            title: true,
            location: true,
            content: true,
            photoUrl: true,
            musicTitle: true,
            musicArtist: true,
            musicArtwork: true
          }
        });
      }

      return {
        id: friendProfile.id,
        friendshipId: f.id,
        username: friendProfile.username,
        avatarUrl: friendProfile.avatarUrl,
        selectedTitle: friendProfile.selectedTitle,
        hasSettledToday,
        currentStreak,
        level,
        logsCount: totalEntries,
        notifyOnUpdate: f.notifyOnUpdate,
        todayLog
      };
    });

    const feedUnsorted = await Promise.all(feedPromises);

    // Custom sort: People who settled today bubble to the top, ordered by streak length.
    const feed = feedUnsorted.sort((a, b) => {
      if (a.hasSettledToday === b.hasSettledToday) return b.currentStreak - a.currentStreak;
      return a.hasSettledToday ? -1 : 1;
    });

    const requests = pendingRequests.map(r => ({
      friendshipId: r.id,
      id: r.user.id,
      username: r.user.username,
      avatarUrl: r.user.avatarUrl,
      selectedTitle: r.user.selectedTitle
    }));

    res.json({ success: true, data: { feed, requests } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/friends/remove/:friendshipId', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const friendshipId = parseInt(req.params.friendshipId);

    const friendship = await prisma.friendship.findUnique({ where: { id: friendshipId } });
    if (!friendship) return res.status(404).json({ success: false, error: 'Friendship not found' });

    if (friendship.userId !== userId && friendship.friendId !== userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized to remove this friendship' });
    }

    await prisma.friendship.delete({ where: { id: friendshipId } });
    res.json({ success: true, message: 'Friend removed successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/friends/notifications/:friendshipId', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const friendshipId = parseInt(req.params.friendshipId);
    const { notifyOnUpdate } = req.body;

    const friendship = await prisma.friendship.findUnique({ where: { id: friendshipId } });
    if (!friendship) return res.status(404).json({ success: false, error: 'Friendship not found' });

    if (friendship.userId !== userId && friendship.friendId !== userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized to modify this friendship' });
    }

    const updated = await prisma.friendship.update({
      where: { id: friendshipId },
      data: { notifyOnUpdate }
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/friends/groups', authenticateToken, async (req: any, res) => {
  try {
    const ownerId = req.user.id;
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Group name required' });

    const group = await prisma.friendGroup.create({
      data: { ownerId, name }
    });
    res.json({ success: true, data: group });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/friends/groups', authenticateToken, async (req: any, res) => {
  try {
    const ownerId = req.user.id;
    const groups = await prisma.friendGroup.findMany({
      where: { ownerId },
      include: {
        members: {
          include: {
            user: { select: { id: true, username: true, avatarUrl: true, selectedTitle: true } }
          }
        }
      }
    });
    res.json({ success: true, data: groups });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/friends/groups/:groupId/members', authenticateToken, async (req: any, res) => {
  try {
    const ownerId = req.user.id;
    const { groupId } = req.params;
    const { userId } = req.body;

    const group = await prisma.friendGroup.findUnique({ where: { id: groupId } });
    if (!group || group.ownerId !== ownerId) return res.status(403).json({ success: false, error: 'Unauthorized' });

    const member = await prisma.groupMember.create({
      data: { groupId, userId }
    });
    res.json({ success: true, data: member });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/friends/groups/:groupId/members/:userId', authenticateToken, async (req: any, res) => {
  try {
    const ownerId = req.user.id;
    const { groupId, userId } = req.params;

    const group = await prisma.friendGroup.findUnique({ where: { id: groupId } });
    if (!group || group.ownerId !== ownerId) return res.status(403).json({ success: false, error: 'Unauthorized' });

    await prisma.groupMember.deleteMany({
      where: { groupId, userId }
    });
    res.json({ success: true, message: 'Member removed from group' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/check', async (req, res) => {
  try {
    const sage = await prisma.user.findUnique({ where: { username: 'sage_master' } });
    if (!sage) return res.send("No sage");
    const logs = await prisma.log.findMany({ where: { userId: sage.id } });
    res.json({ logs });
  } catch (e: any) { res.json({ error: e.message }); }
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
