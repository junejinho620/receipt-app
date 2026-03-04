import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- Database Mocking Script Running ---');

  // 1. Find the "receipt_ninja" user
  const ninja = await prisma.user.findUnique({ where: { username: 'receipt_ninja' } });
  if (ninja) {
    // Approve any pending friendships where ninja is involved
    const pendingRequests = await prisma.friendship.findMany({
      where: {
        OR: [{ userId: ninja.id }, { friendId: ninja.id }],
        status: 'PENDING'
      }
    });

    for (const req of pendingRequests) {
      await prisma.friendship.update({
        where: { id: req.id },
        data: { status: 'ACCEPTED' }
      });
      console.log(`Accepted friend request ${req.id} involving receipt_ninja.`);
    }
  } else {
    console.log('User receipt_ninja not found.');
  }

  // 2. Find "sage_master" and create a log for today
  const sage = await prisma.user.findUnique({ where: { username: 'sage_master' } });
  if (sage) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingLog = await prisma.log.findFirst({
      where: {
        userId: sage.id,
        createdAt: { gte: today }
      }
    });

    if (!existingLog) {
      await prisma.log.create({
        data: {
          userId: sage.id,
          date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
          title: 'Morning Vibes',
          location: 'Aesthetic Coffee Shop',
          inputType: 'Text',
          content: 'Enjoying a calming morning brew before jumping into some React Native design specs. The vibe is immaculate today. ☕️✨',
          musicTitle: 'Lo-Fi Chill Beats',
          musicArtist: 'Various Artists'
        }
      });
      console.log(`Created today's ledger log for sage_master.`);
    } else {
      console.log(`sage_master already has a log for today!`);
    }
  } else {
    console.log('User sage_master not found.');
  }

  console.log('--- Mocking Complete ---');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
