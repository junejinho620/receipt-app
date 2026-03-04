import { PrismaClient } from '@prisma/client';

process.env.DATABASE_URL = "postgresql://junejinho@localhost:5432/receipt_app";
const prisma = new PrismaClient();

async function main() {
  const users = [
    { username: 'sage_master', email: 'sage@test.com', passwordHash: 'dummyhash', selectedTitle: 'Aesthetic Auditor' },
    { username: 'receipt_ninja', email: 'ninja@test.com', passwordHash: 'dummyhash', selectedTitle: 'Night Owl' },
    { username: 'casual_logger', email: 'casual@test.com', passwordHash: 'dummyhash', selectedTitle: 'Streak Starter' }
  ];

  console.log('Seeding dummy accounts...');

  for (const u of users) {
    try {
      await prisma.user.create({ data: u });
      console.log(`Created user: ${u.username}`);
    } catch (e: any) {
      if (e.code === 'P2002') {
        console.log(`User ${u.username} already exists.`);
      } else {
        console.error(`Error creating ${u.username}:`, e);
      }
    }
  }

  console.log('Seed process complete.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
