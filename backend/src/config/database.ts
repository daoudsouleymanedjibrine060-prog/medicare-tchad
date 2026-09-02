import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

function parseDatabaseUrl(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: Number(parsed.port) || 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ''),
  };
}

function requiresSsl(url: string): boolean {
  const parsed = new URL(url);
  const mode = parsed.searchParams.get('ssl-mode') ?? parsed.searchParams.get('sslmode');
  return mode?.toUpperCase() === 'REQUIRED' || parsed.searchParams.has('sslaccept');
}

export function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  const config = parseDatabaseUrl(url);
  const adapter = new PrismaMariaDb({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    connectionLimit: 10,
    ...(requiresSsl(url) ? { ssl: { rejectUnauthorized: true } } : {}),
  });
  return new PrismaClient({ adapter });
}

export const prisma = createPrismaClient();

export async function connectDatabase() {
  await prisma.$connect();
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
}
