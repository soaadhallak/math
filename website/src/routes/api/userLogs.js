import express from 'express';
import { userLogController } from '../../controllers/userLogController.js';
import { requireAdmin } from '../../middleware/auth.js';

const router = express.Router();

router.get('/', requireAdmin, userLogController.list);
router.get('/:id', requireAdmin, userLogController.getById);

export default router;
