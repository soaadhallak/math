import prisma from '../config/database.js';

/** Keys to redact from request body when logging (e.g. login payloads) */
const REDACT_KEYS = ['password', 'passwordHash', 'currentPassword', 'newPassword'];

/**
 * Get client IP, preferring Cloudflare and proxy headers.
 * When behind Cloudflare: CF-Connecting-IP is the real client IP.
 * X-Forwarded-For leftmost is client when request passed through trusted proxies.
 */
function getClientIp(req) {
  const raw =
    req.headers['cf-connecting-ip'] || // Cloudflare: real client IP
    (req.headers['x-forwarded-for'] && req.headers['x-forwarded-for'].split(',')[0]?.trim()) ||
    req.ip ||
    req.socket?.remoteAddress ||
    req.connection?.remoteAddress ||
    null;
  if (!raw) return null;
  // Normalize IPv6-mapped IPv4 (::ffff:1.2.3.4 -> 1.2.3.4)
  const ip = raw.replace(/^::ffff:/i, '').trim();
  return ip.length > 45 ? ip.substring(0, 45) : ip;
}

/**
 * Redact sensitive fields from an object (shallow), then stringify.
 */
function safeRequestBody(obj, maxLength = 5000) {
  if (!obj || typeof obj !== 'object' || Object.keys(obj).length === 0) return null;
  const copy = { ...obj };
  for (const key of REDACT_KEYS) {
    if (key in copy) copy[key] = '[REDACTED]';
  }
  const bodyStr = JSON.stringify(copy);
  return bodyStr.length > maxLength ? bodyStr.substring(0, maxLength) : bodyStr;
}

/**
 * Middleware to log admin API requests to UserLog table.
 * Applied to all /api routes; logs endpoint, method, IP (Cloudflare-aware), user (from session), timing, etc.
 */
export const logUserRequest = async (req, res, next) => {
  const startTime = Date.now();
  const originalSend = res.send;

  res.send = function (body) {
    return originalSend.call(this, body);
  };

  res.on('finish', async () => {
    try {
      // Log only authenticated users; skip login and unauthenticated requests
      const userId = req.session?.userId ?? null;
      if (userId == null) return;
      const path = (req.originalUrl || req.url || req.path || '').split('?')[0];
      if (path === '/api/auth/login' || path.endsWith('/auth/login')) return;

      const executionTime = Date.now() - startTime;
      const requestBody = safeRequestBody(req.body);
      const ipAddress = getClientIp(req);
      const userAgent = req.headers['user-agent'] || null;
      const endpointTruncated = path.length > 500 ? path.substring(0, 500) : path;
      const method = (req.method || '').length > 10 ? req.method.substring(0, 10) : req.method;
      const userAgentTruncated = userAgent && userAgent.length > 500 ? userAgent.substring(0, 500) : userAgent;

      await prisma.userLog.create({
        data: {
          userId,
          endpoint: endpointTruncated,
          httpMethod: method,
          ipAddress,
          requestBody,
          responseStatusCode: res.statusCode,
          userAgent: userAgentTruncated,
          executionTimeMs: executionTime,
          status: true,
        },
      });
    } catch (error) {
      console.error('Error logging user request:', error);
    }
  });

  next();
};
