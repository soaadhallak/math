import express from 'express';
import { documentController } from '../../controllers/documentController.js';
import { requireAdmin } from '../../middleware/auth.js';
import { uploadSingle } from '../../middleware/upload.js';

const router = express.Router();

router.get('/', requireAdmin, documentController.list);
router.post('/bulk-delete', requireAdmin, documentController.bulkDelete);
router.get('/:id', requireAdmin, documentController.getById);
router.post('/upload', requireAdmin, uploadSingle('file'), documentController.upload);
router.post('/', requireAdmin, documentController.create);
router.put('/:id', requireAdmin, documentController.update);
router.delete('/:id', requireAdmin, documentController.delete);

export default router;

