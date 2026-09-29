import express from 'express';
import { uploadSingle, uploadMultiple, getPublicUploadPath } from '../../middleware/upload.js';
import { requireAdmin } from '../../middleware/auth.js';

const router = express.Router();

router.post('/single', requireAdmin, uploadSingle('file'), (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    res.json({
      success: true,
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: getPublicUploadPath(req.file),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/multiple', requireAdmin, uploadMultiple('files', 10), (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const files = req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: getPublicUploadPath(file),
    }));

    res.json({
      success: true,
      files,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
