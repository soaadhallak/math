import express from 'express';
import { referenceLogoController } from '../../controllers/referenceLogoController.js';
import { requireAdmin } from '../../middleware/auth.js';

const router = express.Router();

router.get('/', requireAdmin, referenceLogoController.list);
router.get('/:id', requireAdmin, referenceLogoController.getById);
router.post('/', requireAdmin, referenceLogoController.create);
router.put('/:id', requireAdmin, referenceLogoController.update);
router.delete('/:id', requireAdmin, referenceLogoController.delete);

export default router;
