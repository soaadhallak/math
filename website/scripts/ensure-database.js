/**
 * Ensures the database from DATABASE_URL exists (creates it if missing).
 * Run with: npm run prisma:ensure-db
 * Uses env from loadEnv (e.g. .env.development when NODE_ENV=development).
 */
import '../src/config/loadEnv.js';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const mariadb = require('mariadb');

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

const url = new URL(dbUrl.replace(/^mysql:\/\//, 'http://'));
const database = url.pathname.slice(1);

async function main() {
  const conn = await mariadb.createConnection({
    host: url.hostname,
    port: parseInt(url.port || '3306', 10),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
  });

  try {
    const escapedDatabase = database.replace(/`/g, '``');
    const rows = await conn.query('SHOW DATABASES LIKE ?', [database]);
    const exists = Array.isArray(rows) && rows.length > 0;

    if (!exists) {
      console.log(`Database "${database}" not found. Creating...`);
      await conn.query(`CREATE DATABASE IF NOT EXISTS \`${escapedDatabase}\``);
      console.log(`Database "${database}" created.`);
    } else {
      console.log(`Database "${database}" already exists.`);
    }
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
