import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import mariadb, { type Pool } from 'mariadb';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

function parseDatabaseUrl(urlStr?: string) {
  if (!urlStr) {
    return {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'dark_syndicate',
      connectionLimit: 10,
    };
  }

  try {
    // Handle both mysql:// and mariadb:// URLs
    const normalized = urlStr.replace(/^mysql:\/\//, 'http://').replace(/^mariadb:\/\//, 'http://');
    const parsed = new URL(normalized);
    return {
      host: parsed.hostname || 'localhost',
      port: parsed.port ? Number(parsed.port) : 3306,
      user: decodeURIComponent(parsed.username || 'root'),
      password: decodeURIComponent(parsed.password || ''),
      database: parsed.pathname ? parsed.pathname.replace(/^\//, '') : 'dark_syndicate',
      connectionLimit: 10,
    };
  } catch {
    return {
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      database: 'dark_syndicate',
      connectionLimit: 10,
    };
  }
}

function createPrismaClient(): PrismaClient {
  const dbConfig = parseDatabaseUrl(process.env.DATABASE_URL);
  const pool = globalForPrisma.pool ?? mariadb.createPool(dbConfig);
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.pool = pool;
  }

  const adapter = new PrismaMariaDb(pool as any);
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
