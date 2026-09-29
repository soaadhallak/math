import express from 'express';
import { messageController } from '../../controllers/messageController.js';
import { requireAdmin } from '../../middleware/auth.js';
import { verifyRecaptcha } from '../../middleware/recaptcha.js';
import { messageSubmitLimiter } from '../../config/rateLimit.js';

const router = express.Router();

// Public — contact form submission. Strict per-IP rate limit (default 5 / 15min)
// + reCAPTCHA v3 verification (no-op if RECAPTCHA_SECRET_KEY is unset).
router.post(
  '/',
  messageSubmitLimiter,
  verifyRecaptcha('contact_message'),
  messageController.submit
);

// Admin
router.get('/', requireAdmin, messageController.list);
router.get('/:id', requireAdmin, messageController.getById);
router.patch('/:id/read', requireAdmin, messageController.markRead);
router.delete('/:id', requireAdmin, messageController.delete);

export default router;
