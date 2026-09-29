import express from 'express';
import { projectCategoryController } from '../../controllers/projectCategoryController.js';
import { requireAdmin } from '../../middleware/auth.js';

const router = express.Router();

router.get('/', requireAdmin, projectCategoryController.list);
router.get('/:id', requireAdmin, projectCategoryController.getById);
router.post('/', requireAdmin, projectCategoryController.create);
router.put('/:id', requireAdmin, projectCategoryController.update);
router.delete('/:id', requireAdmin, projectCategoryController.delete);

export default router;
