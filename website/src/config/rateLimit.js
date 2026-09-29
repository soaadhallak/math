/**
 * Rate limiting configuration. Cloudflare-aware: uses CF-Connecting-IP when
 * present so limits are per real client IP when behind Cloudflare. Works without
 * Cloudflare using X-Forwarded-For (trust proxy) or socket.remoteAddress.
 * Load env before importing (e.g. via loadEnv in main.js).
 */
import { rateLimit, ipKeyGenerator } from 'express-rate-limit';

const isEnabled = process.env.RATE_LIMIT_ENABLED === 'true';
const windowMs = Math.max(60_000, parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10));
const maxGeneral = Math.max(1, parseInt(process.env.RATE_LIMIT_MAX_GENERAL || '100', 10));
const maxAuth = Math.max(1, parseInt(process.env.RATE_LIMIT_MAX_AUTH || '10', 10));
const authWindowMs = Math.max(60_000, parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS || '900000', 10)); // 15 min default
const maxMessages = Math.max(1, parseInt(process.env.RATE_LIMIT_MAX_MESSAGES || '5', 10));
const messagesWindowMs = Math.max(60_000, parseInt(process.env.RATE_LIMIT_MESSAGES_WINDOW_MS || '900000', 10)); // 15 min default

/** Get client IP: Cloudflare → X-Forwarded-For → req.ip → socket (for proxy-aware apps). */
export function getClientIp(req) {
  const cf = req.get('CF-Connecting-IP');
  if (cf && typeof cf === 'string' && cf.trim()) return cf.trim();
  const forwarded = req.get('X-Forwarded-For');
  if (forwarded && typeof forwarded === 'string') {
    const first = forwarded.split(',')[0].trim();
    if (first) return first;
  }
  if (req.ip) return req.ip;
  return req.socket?.remoteAddress || 'unknown';
}

/** Key generator for rate limit: same client ID as Cloudflare/proxy would see, with IPv6 subnet handling. */
function keyGenerator(req) {
  const ip = getClientIp(req);
  return ipKeyGenerator(ip, 56);
}

const baseOptions = {
  keyGenerator,
  legacyHeaders: true,
  standardHeaders: true,
  validate: { default: false },
  skip: () => !isEnabled,
  handler: (req, res, _next, options) => {
    res.status(options.statusCode);
    if (req.path.startsWith('/api')) {
      res.set('Retry-After', String(Math.ceil(options.windowMs / 1000)));
      return res.json({
        error: 'Too many requests',
        message: options.message,
        retryAfter: Math.ceil(options.windowMs / 1000),
      });
    }
    res.send(options.message);
  },
};

/** General API rate limiter (all /api/*). */
export const generalApiLimiter = rateLimit({
  ...baseOptions,
  windowMs,
  limit: maxGeneral,
  message: 'Too many requests, please try again later.',
});

/** Stricter limiter for auth (login). Use on POST /api/auth/login only. */
export const authLimiter = rateLimit({
  ...baseOptions,
  windowMs: authWindowMs,
  limit: maxAuth,
  message: 'Too many login attempts, please try again later.',
});

/** Strict limiter for the public contact form (POST /api/messages). Defaults: 5 / 15 min / IP. */
export const messageSubmitLimiter = rateLimit({
  ...baseOptions,
  windowMs: messagesWindowMs,
  limit: maxMessages,
  message: 'Too many messages submitted from this IP. Please try again later.',
});

export const rateLimitConfig = {
  isEnabled,
  windowMs,
  maxGeneral,
  maxAuth,
  authWindowMs,
  maxMessages,
  messagesWindowMs,
};
