import '../src/config/loadEnv.js';
import { generateSitemap } from '../src/services/sitemapService.js';
import prisma from '../src/config/database.js';

generateSitemap()
  .then(({ count, outPath }) => {
    console.log('Sitemap written to %s (%s URLs)', outPath, count);
  })
  .catch((err) => {
  console.error(err);
  process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
