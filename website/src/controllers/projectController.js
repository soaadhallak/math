import { projectService } from '../services/projectService.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';

export const projectController = {
  async list(req, res, next) {
    try {
      const locale = req.language || 'en';
      const filterOptions = {
        status: req.query.status !== undefined ? req.query.status === 'true' : undefined,
        projectCategoryId: req.query.categoryId,
        projectCategorySlug: req.query.category || req.query.categorySlug,
        search: req.query.search,
      };
      const paginationRequested = req.query.page !== undefined || req.query.limit !== undefined;
      if (paginationRequested) {
        const { page, limit, skip } = parsePagination(req.query);
        const [projects, total] = await Promise.all([
          projectService.list(locale, { ...filterOptions, limit, offset: skip }),
          projectService.count(filterOptions),
        ]);
        res.json({
          data: projects,
          pagination: buildPaginationMeta(page, limit, total),
        });
      } else {
        const projects = await projectService.list(locale, {
          ...filterOptions,
          limit: req.query.limit ? parseInt(req.query.limit) : undefined,
          offset: req.query.offset ? parseInt(req.query.offset) : undefined,
        });
        res.json(projects);
      }
    } catch (error) {
      next(error);
    }
  },

  async getBySlug(req, res, next) {
    try {
      const { slug } = req.params;
      const locale = req.language || 'en';
      const project = await projectService.findBySlug(slug, locale);

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      res.json(project);
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      // Return all translations so admin edit form can load every locale (en, id, ar, etc.)
      const project = await projectService.findByIdWithAllTranslations(parseInt(id));

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      res.json(project);
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const project = await projectService.create(req.body);
      res.status(201).json(project);
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const project = await projectService.update(parseInt(id), req.body);
      res.json(project);
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await projectService.delete(parseInt(id));
      res.json({ success: true, message: 'Project deleted successfully' });
    } catch (error) {
      next(error);
    }
  },
};
