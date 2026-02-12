import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 NyayaSankalan Backend Server');
  console.log('✅ Prisma connected successfully');
  
  // Test database connection
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    const userCount = await prisma.user.count();
    console.log(`📊 Total users: ${userCount}`);
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
