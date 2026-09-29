import express from 'express';
import { authController } from '../../controllers/authController.js';
import { setSessionExpiry, requireAdmin } from '../../middleware/auth.js';
import { authLimiter } from '../../config/rateLimit.js';

const router = express.Router();

router.post('/login', authLimiter, setSessionExpiry, authController.login);
router.post('/logout', requireAdmin, authController.logout);
router.get('/check', requireAdmin, authController.checkAuth);

export default router;
