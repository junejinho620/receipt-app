import { PrismaClient } from '@prisma/client';

process.env.DATABASE_URL = "postgresql://junejinho@localhost:5432/receipt_app";
const prisma = new PrismaClient();

async function main() {
  const sage = await prisma.user.findUnique({ where: { username: 'sage_master' } });
  if (!sage) throw new Error("Could not find sage_master");

  // 1. Accept pending friendships for sage
  const pending = await prisma.friendship.findMany({
    where: { friendId: sage.id, status: 'pending' }
  });

  for (const p of pending) {
    await prisma.friendship.update({
      where: { id: p.id },
      data: { status: 'accepted' }
    });
    console.log(`Accepted friendship request from user ${p.userId}`);
  }

  // 2. Create a log for today (2026-03-02)
  await prisma.log.create({
    data: {
      userId: sage.id,
      date: '2026-03-02',
      vendor: 'Matcha Cafe',
      total: 6.50,
      photoUri: null,
      notes: "Just vibing and drinking matcha.",
    }
  });

  console.log("Successfully created a fresh daily log for sage_master!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
