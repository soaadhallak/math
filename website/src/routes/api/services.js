import express from 'express';
import { serviceController } from '../../controllers/serviceController.js';
import { requireAdmin } from '../../middleware/auth.js';

const router = express.Router();

router.get('/', requireAdmin, serviceController.list);
router.get('/:slug', requireAdmin, serviceController.getBySlug);
router.post('/', requireAdmin, serviceController.create);
router.get('/admin/:id', requireAdmin, serviceController.getById);
router.put('/:id', requireAdmin, serviceController.update);
router.delete('/:id', requireAdmin, serviceController.delete);

export default router;
