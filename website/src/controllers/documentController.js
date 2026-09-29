import { documentService } from '../services/documentService.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';
import { getPublicUploadPath } from '../middleware/upload.js';
import path from 'path';

const DOCUMENT_NAME_MAX = 50;

function buildDocumentName(originalName = '', fallbackName = '') {
  const basename = path.parse(String(originalName)).name;
  const normalized = basename.trim().replace(/\s+/g, ' ');
  const safe = normalized || fallbackName || 'uploaded-file';
  const clipped = safe.slice(0, DOCUMENT_NAME_MAX);
  if (clipped.length >= 5) return clipped;
  return `${clipped}-file`.slice(0, DOCUMENT_NAME_MAX);
}

export const documentController = {
  async list(req, res, next) {
    try {
      const paginationRequested = req.query.page !== undefined || req.query.limit !== undefined;
      if (paginationRequested) {
        const { page, limit, skip } = parsePagination(req.query);
        const filterOptions = { search: req.query.search };
        const [documents, total] = await Promise.all([
          documentService.list({ ...filterOptions, limit, offset: skip }),
          documentService.count(filterOptions),
        ]);
        res.json({
          data: documents,
          pagination: buildPaginationMeta(page, limit, total),
        });
      } else {
        const filterOptions = { search: req.query.search };
        const documents = await documentService.list(filterOptions);
        res.json(documents);
      }
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const document = await documentService.findById(parseInt(id));

      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      res.json(document);
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const document = await documentService.create(req.body);
      res.status(201).json(document);
    } catch (error) {
      next(error);
    }
  },

  async upload(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const publicPath = getPublicUploadPath(req.file);
      const payload = {
        name: buildDocumentName(req.file.originalname, req.file.filename),
        src: publicPath,
        sort: req.body?.sort !== undefined ? Number.parseInt(req.body.sort, 10) || 0 : 0,
      };

      const document = await documentService.create(payload);

      res.status(201).json({
        success: true,
        message: 'File uploaded successfully',
        data: document,
        file: {
          filename: req.file.filename,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          path: publicPath,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const document = await documentService.update(parseInt(id), req.body);
      res.json(document);
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await documentService.delete(parseInt(id));
      res.json({ success: true, message: 'Document deleted successfully' });
    } catch (error) {
      next(error);
    }
  },

  async bulkDelete(req, res, next) {
    try {
      const result = await documentService.deleteMany(req.body);
      res.json({
        success: true,
        message: `${result.deletedCount} document(s) deleted successfully`,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  },
};

