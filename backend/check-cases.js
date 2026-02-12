const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCases() {
  try {
    const cases = await prisma.case.findMany({
      include: { fir: true },
      take: 20,
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`Total cases found: ${cases.length}\n`);
    
    cases.forEach((c, i) => {
      const year = new Date(c.fir.incidentDate).getFullYear();
      console.log(`${i + 1}. ${c.fir.firNumber} - Year: ${year} - Sections: ${c.fir.sectionsApplied}`);
    });
    
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkCases();
