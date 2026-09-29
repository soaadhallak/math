import { projectCategoryService } from '../services/projectCategoryService.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';

export const projectCategoryController = {
  async list(req, res, next) {
    try {
      const locale = req.language || 'en';
      const filterOptions = {
        status: req.query.status !== undefined ? req.query.status === 'true' : undefined,
        search: req.query.search,
      };
      const paginationRequested = req.query.page !== undefined || req.query.limit !== undefined;
      if (paginationRequested) {
        const { page, limit, skip } = parsePagination(req.query);
        const [categories, total] = await Promise.all([
          projectCategoryService.list(locale, { ...filterOptions, limit, offset: skip }),
          projectCategoryService.count(filterOptions),
        ]);
        res.json({
          data: categories,
          pagination: buildPaginationMeta(page, limit, total),
        });
      } else {
        const categories = await projectCategoryService.list(locale, filterOptions);
        res.json(categories);
      }
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      // Return all translations so admin edit form can load every locale (en, id, ar, etc.)
      const category = await projectCategoryService.findByIdWithAllTranslations(parseInt(id));
      
      if (!category) {
        return res.status(404).json({ error: 'Project category not found' });
      }
      
      res.json(category);
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const category = await projectCategoryService.create(req.body);
      res.status(201).json(category);
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const category = await projectCategoryService.update(parseInt(id), req.body);
      res.json(category);
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await projectCategoryService.delete(parseInt(id));
      res.json({ success: true, message: 'Project category deleted successfully' });
    } catch (error) {
      next(error);
    }
  },
};
