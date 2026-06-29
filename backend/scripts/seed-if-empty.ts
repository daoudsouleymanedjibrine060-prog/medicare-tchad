import 'dotenv/config';
import { createPrismaClient } from '../src/config/database';
import { execSync } from 'child_process';

async function main() {
  const prisma = createPrismaClient();
  const count = await prisma.user.count();
  await prisma.$disconnect();
  if (count === 0) {
    console.log('Base vide — exécution du seed...');
    execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' });
  } else {
    console.log('Base déjà initialisée — seed ignoré.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
