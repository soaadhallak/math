import express from 'express';
import { userController } from '../../controllers/userController.js';
import { requireAdmin } from '../../middleware/auth.js';

const router = express.Router();

router.get('/', requireAdmin, userController.list);
router.get('/:id', requireAdmin, userController.getById);
router.post('/', requireAdmin, userController.create);
router.put('/:id', requireAdmin, userController.update);
router.delete('/:id', requireAdmin, userController.delete);

export default router;
