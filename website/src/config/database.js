import './loadEnv.js';
import { createRequire } from 'node:module';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const require = createRequire(import.meta.url);
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const url = new URL(dbUrl.replace(/^mysql:\/\//, 'http://'));
const database = url.pathname.slice(1);

async function loadPrismaClientOrThrow() {
  const prismaClientModule = await import('@prisma/client');
  const PrismaClient =
    prismaClientModule?.PrismaClient
    || prismaClientModule?.default?.PrismaClient;

  if (!PrismaClient) {
    throw new Error('Unable to load PrismaClient from @prisma/client');
  }

  return PrismaClient;
}

const PrismaClient = await loadPrismaClientOrThrow();

const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: parseInt(url.port || '3306', 10),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database,
  connectionLimit: 5,
});

const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development'
    ? ['error', 'warn', ...(process.env.PRISMA_DEBUG_MODE === 'true' ? ['query'] : [])]
    : ['error'],
});

export default prisma;
