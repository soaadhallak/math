/**
 * Google reCAPTCHA v3 verification middleware.
 *
 * - If RECAPTCHA_SECRET_KEY is unset, the middleware no-ops (useful in dev).
 * - Otherwise it expects req.body.recaptchaToken, calls Google's siteverify, and
 *   rejects the request when success=false, action mismatches, or score < min.
 *
 * Usage:
 *   router.post('/', verifyRecaptcha('contact_message'), controller.submit);
 */

const VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';
const DEFAULT_MIN_SCORE = 0.5;

function getClientIp(req) {
  const cf = req.get('CF-Connecting-IP');
  if (cf && typeof cf === 'string' && cf.trim()) return cf.trim();
  const forwarded = req.get('X-Forwarded-For');
  if (forwarded && typeof forwarded === 'string') {
    const first = forwarded.split(',')[0].trim();
    if (first) return first;
  }
  return req.ip || req.socket?.remoteAddress || undefined;
}

export function verifyRecaptcha(expectedAction) {
  return async function recaptchaMiddleware(req, res, next) {
    const secret = process.env.RECAPTCHA_SECRET_KEY;
    if (!secret) {
      // Verification disabled — skip silently. Surface a clear log so it's not forgotten in prod.
      if (process.env.NODE_ENV === 'production') {
        console.warn('[recaptcha] RECAPTCHA_SECRET_KEY is not set — submission accepted without verification.');
      }
      return next();
    }

    const token = req.body?.recaptchaToken;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'reCAPTCHA token missing' });
    }

    const minScore = Math.min(
      1,
      Math.max(0, parseFloat(process.env.RECAPTCHA_MIN_SCORE || String(DEFAULT_MIN_SCORE)))
    );

    try {
      const params = new URLSearchParams({ secret, response: token });
      const remoteIp = getClientIp(req);
      if (remoteIp) params.set('remoteip', remoteIp);

      const response = await fetch(VERIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });
      const data = await response.json().catch(() => ({}));

      if (!data || data.success !== true) {
        return res.status(400).json({
          error: 'reCAPTCHA verification failed',
          codes: data?.['error-codes'] || [],
        });
      }
      if (expectedAction && data.action && data.action !== expectedAction) {
        return res.status(400).json({ error: 'reCAPTCHA action mismatch' });
      }
      if (typeof data.score === 'number' && data.score < minScore) {
        return res.status(400).json({
          error: 'reCAPTCHA score too low; submission appears automated',
        });
      }

      // Strip the token before it reaches the controller / DB.
      if (req.body && typeof req.body === 'object') delete req.body.recaptchaToken;

      return next();
    } catch (err) {
      console.error('[recaptcha] verify failed:', err);
      return res.status(502).json({ error: 'reCAPTCHA verification unavailable' });
    }
  };
}
