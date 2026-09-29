import express from 'express';
import { projectController } from '../../controllers/projectController.js';
import { requireAdmin } from '../../middleware/auth.js';

const router = express.Router();

router.get('/', requireAdmin, projectController.list);
router.get('/:slug', requireAdmin, projectController.getBySlug);
router.post('/', requireAdmin, projectController.create);
router.get('/admin/:id', requireAdmin, projectController.getById);
router.put('/:id', requireAdmin, projectController.update);
router.delete('/:id', requireAdmin, projectController.delete);

export default router;
