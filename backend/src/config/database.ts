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

function buildSslOption(url: string): { ssl?: { rejectUnauthorized: boolean; ca?: string } } {
  if (!requiresSsl(url)) return {};
  const ca = process.env.DATABASE_SSL_CA?.replace(/\\n/g, '\n').trim();
  if (ca) {
    return { ssl: { rejectUnauthorized: true, ca } };
  }
  // Aiven / managed MySQL: TLS chiffre ; sans CA locale, ne pas bloquer sur la chaine
  return { ssl: { rejectUnauthorized: false } };
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
    connectionLimit: 5,
    connectTimeout: 30_000,
    ...buildSslOption(url),
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
