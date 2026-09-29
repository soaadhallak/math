import './config/loadEnv.js';
import express from 'express';
import expressSession from 'express-session';
import expressLayouts from 'express-ejs-layouts';
import cors from 'cors';
import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import middleware from 'i18next-http-middleware';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import apiRoutes from './routes/api/index.js';
import publicRoutes from './routes/public/index.js';
import { company, seo, baseUrl } from './config/site.js';
import { generalApiLimiter } from './config/rateLimit.js';
import { localeNames, ogLocaleMap } from './config/locales.js';
import { startSitemapScheduler } from './services/sitemapService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT;
const expressApp = express();

// Trust proxy: Nginx + Cloudflare sit in front of Node. req.secure and req.ip use X-Forwarded-Proto / X-Forwarded-For.
if (process.env.TRUST_PROXY === 'true') {
  expressApp.set('trust proxy', 2); // Cloudflare → Nginx → Node
}

// Available locales from env (comma-separated). Fallback matches default locale files in src/locales/.
const supportedLangs = (process.env.AVAILABLE_LOCALES || 'en,tr,ar')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

function normalizeLanguageCode(language, availableLocales) {
  if (!language || typeof language !== 'string') return 'en';
  const base = language.split('-')[0].toLowerCase();
  if (availableLocales.includes(base)) return base;
  return availableLocales.includes('en') ? 'en' : availableLocales[0] || 'en';
}

// Initialize i18next
i18next
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    lng: 'en',
    fallbackLng: 'en',
    supportedLngs: supportedLangs,
    backend: {
      loadPath: path.join(__dirname, 'locales', '{{lng}}.json'),
    },
    detection: {
      // Priority: explicit URL override -> saved preference -> browser language.
      // This gives first-time visitors automatic language detection from Accept-Language,
      // while preserving manual language choices on later visits.
      order: ['querystring', 'cookie', 'header'],
      lookupQuerystring: 'lang',
      lookupCookie: 'i18next',
      caches: ['cookie'],
    },
    interpolation: {
      escapeValue: false,
      defaultVariables: {
        companyName: company.name,
        city: company.city,
        countryName: company.countryName,
      },
    },
  });

// Middleware
expressApp.use(express.json());
expressApp.use(express.urlencoded({ extended: true }));

// CORS configuration (allow all origins for credentials/cookies) for development only, because we are using localhost:5173 for admin panel
// In production, admin is built in the same domain as the website, so we don't need to allow all origins.
if(process.env.NODE_ENV === 'development') {
  expressApp.use(cors({
    origin: true,
    credentials: true,
  }));
}

// Session configuration
const isProduction = process.env.NODE_ENV === 'production';
// Behind Nginx + Cloudflare the connection to Node is often HTTP, so req.secure is false and express-session
// would not set the cookie if secure: true. Using secure: false so the session cookie is set; the browser
// still sends it to the same origin (HTTPS). To use secure: true, have Nginx forward X-Forwarded-Proto (see docs).
expressApp.use(expressSession({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days default (remember me)
    ...(isProduction
      ? { sameSite: 'lax' }
      : { sameSite: 'lax', domain: 'localhost' }
    ),
  },
}));

// i18n middleware
expressApp.use(middleware.handle(i18next));

// View engine setup
expressApp.set('view engine', 'ejs');
expressApp.set('views', path.join(__dirname, 'views'));
expressApp.use(expressLayouts);
expressApp.set('layout', 'layouts/main');

// Static files
expressApp.use(express.static(path.join(__dirname, '..', 'public')));
expressApp.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Swagger documentation (dev only) – spec from swagger-autogen (npm run swagger:generate)
if (process.env.NODE_ENV === 'development') {
  try {
    const swaggerUi = (await import('swagger-ui-express')).default;
    const specPath = path.join(__dirname, '..', 'generated', 'swagger-output.json');
    let swaggerSpec = { openapi: '3.0.0', info: { title: 'API', version: '1.0.0' }, paths: {} };
    try {
      swaggerSpec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
    } catch (_) {
      console.warn('Run "npm run swagger:generate" to generate API docs. Serving minimal spec.');
    }
    expressApp.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
      customJs: '/swagger-ui/swagger-light-default.js',
    }));
    console.log("Swagger documentation is available at /swagger");
  } catch (err) {
    console.warn('Swagger setup failed:', err.message);
  }
}

// Extract YouTube video ID from URL for embed (watch, youtu.be, or embed)
function getYoutubeEmbedId(src) {
  if (!src || typeof src !== 'string') return '';
  const match = src.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?/]+)/);
  return match ? match[1] : src;
}

// Make i18n and site config available in views
expressApp.use((req, res, next) => {
  const normalizedLanguage = normalizeLanguageCode(req.language, supportedLangs);
  req.language = normalizedLanguage;
  res.locals.t = req.t;
  res.locals.language = normalizedLanguage;
  res.locals.languages = supportedLangs;
  res.locals.localeNames = localeNames;
  res.locals.ogLocaleMap = ogLocaleMap;
  res.locals.company = company;
  // Request-scoped SEO defaults (localized); fallback to env-based config
  res.locals.seo = {
    defaultTitle: req.t('seo.defaultTitle') || seo.defaultTitle,
    defaultDescription: req.t('seo.defaultDescription') || seo.defaultDescription,
    defaultKeywords: req.t('seo.defaultKeywords') || seo.defaultKeywords,
  };
  res.locals.baseUrl = baseUrl;
  res.locals.appName = process.env.APP_NAME;
  res.locals.metaAuthor = process.env.META_AUTHOR;
  res.locals.analytics = {
    gaMeasurementId: process.env.GA_MEASUREMENT_ID || '',
    clarityProjectId: process.env.CLARITY_PROJECT_ID || '',
  };
  res.locals.recaptchaSiteKey = process.env.RECAPTCHA_SITE_KEY || '';
  res.locals.getYoutubeEmbedId = getYoutubeEmbedId;
  // For hreflang: current path (no query) so we can build alternate URLs
  res.locals.currentPath = req.path || '/';
  next();
});

// Rate limiting for API (Cloudflare-aware; respects RATE_LIMIT_* env)
expressApp.use('/api', generalApiLimiter);

// Routes
expressApp.use('/api', apiRoutes);
expressApp.use('/', publicRoutes);

// Admin SPA fallback: serve admin index.html for any path under ADMIN_BUILD_FOLDER so client-side routing and refresh work
const ADMIN_BUILD_FOLDER = process.env.ADMIN_BUILD_FOLDER || 'admin-e2891';
expressApp.get(new RegExp(`^/${ADMIN_BUILD_FOLDER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:/.*)?$`), (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', ADMIN_BUILD_FOLDER, 'index.html'));
});

// 404 handler (must be before error handler)
expressApp.use(notFoundHandler);

// Error handler (must be last)
expressApp.use(errorHandler);

expressApp.listen(PORT, () => {
  console.log("===============================");
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log("===============================");
  startSitemapScheduler();
});

