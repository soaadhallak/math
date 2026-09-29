/**
 * Generate OpenAPI spec from Express route code (no JSDoc).
 * Uses swagger-autogen (parses source; works with Express 5).
 * Run: npm run swagger:generate
 */
const path = require('path');
const fs = require('fs');

/** camelCase / PascalCase → "Title Case" (e.g. productCategories → Product Categories) */
function normalizeToTag(name) {
  if (!name || typeof name !== 'string') return name;
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/** camelCase / PascalCase → kebab-case (e.g. productCategories → product-categories) */
function fileNameToPath(name) {
  if (!name || typeof name !== 'string') return name;
  return name
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '');
}

(async () => {
  // Use project's loadEnv (same as main.js)
  await import('../src/config/loadEnv.js');

  const swaggerAutogen = require('swagger-autogen')({
    openapi: '3.0.0',
  });

  // swagger-autogen resolves paths relative to the script dir (scripts/); absolute paths break (e.g. double extension).
  const rootDir = path.resolve(__dirname, '..');
  const generatedDir = path.join(rootDir, 'generated');
  fs.mkdirSync(generatedDir, { recursive: true });

  const outputFile = '../generated/swagger-output.json';
  // swagger-autogen does not follow imports; discover route files under src/routes/api/
  const apiRoutesDir = path.join(rootDir, 'src', 'routes', 'api');
  const apiRouteFiles = fs.readdirSync(apiRoutesDir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.js'))
    .map((e) => path.join('..', 'src', 'routes', 'api', e.name).split(path.sep).join('/'));
  // Do not include main.js — loading it starts the HTTP server and hangs generation.
  const endpointsFiles = apiRouteFiles;

  // Build path prefix → tag from endpoint file names (exclude index.js)
  const prefixToTag = [];
  for (const filePath of apiRouteFiles) {
    const baseName = path.basename(filePath, '.js');
    if (baseName === 'index') continue;
    const tag = normalizeToTag(baseName);
    const pathSegment = fileNameToPath(baseName);
    prefixToTag.push(['/api/' + pathSegment, tag]);
    prefixToTag.push(['/' + pathSegment, tag]);
    if (baseName === 'auth') {
      prefixToTag.push(['/login', tag], ['/logout', tag], ['/check', tag]);
    }
  }
  // Sort by prefix length descending so longer paths match first
  prefixToTag.sort((a, b) => b[0].length - a[0].length);

  const doc = {
    info: {
      title: process.env.API_TITLE || 'API',
      version: process.env.API_VERSION || '1.0.0',
      description: process.env.API_DESCRIPTION || 'API documentation generated from route code.',
    },
    host: process.env.APP_BASE_URL ? new URL(process.env.APP_BASE_URL).host : 'localhost:3000',
    schemes: process.env.APP_BASE_URL && process.env.APP_BASE_URL.startsWith('https') ? ['https'] : ['http'],
    servers: process.env.APP_BASE_URL
      ? [{ url: process.env.APP_BASE_URL, description: 'Development server' }]
      : [{ url: 'http://localhost:3000', description: 'Development server' }],
    components: {
      securitySchemes: {
        sessionAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'connect.sid',
        },
      },
    },
  };

  await swaggerAutogen(outputFile, endpointsFiles, doc);

  // Post-process: add tags so Swagger UI shows each file's endpoints in a separate section
  const specPath = path.join(rootDir, 'generated', 'swagger-output.json');
  const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
  const tagSet = new Set();

  for (const pathKey of Object.keys(spec.paths || {})) {
    let tag = 'Public';
    for (const [prefix, t] of prefixToTag) {
      if (pathKey === prefix || pathKey.startsWith(prefix + '/')) {
        tag = t;
        break;
      }
    }
    tagSet.add(tag);
    for (const op of Object.values(spec.paths[pathKey])) {
      if (op && typeof op === 'object' && !Array.isArray(op)) {
        op.tags = [tag];
      }
    }
  }

  spec.tags = Array.from(tagSet)
    .sort((a, b) => (a === 'Public' ? 1 : 0) - (b === 'Public' ? 1 : 0) || a.localeCompare(b))
    .map((name) => ({ name, description: `Endpoints from ${name}` }));

  fs.writeFileSync(specPath, JSON.stringify(spec, null, 2), 'utf8');
  console.log('Swagger spec written to', outputFile);
})();
