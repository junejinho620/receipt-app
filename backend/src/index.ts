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

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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

// ----------------------------------------------------
// LOGS (RECEIPTS)
// ----------------------------------------------------
app.post('/api/logs', async (req, res) => {
  try {
    const { userId, date, title, location, inputType, content, photoUrl } = req.body;
    const log = await prisma.log.create({
      data: { userId, date, title, location, inputType, content, photoUrl }
    });
    res.json({ success: true, data: log });
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
