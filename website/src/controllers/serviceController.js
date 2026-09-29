import { serviceService } from '../services/serviceService.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';

export const serviceController = {
  async list(req, res, next) {
    try {
      const locale = req.language || 'en';
      const filterOptions = {
        status: req.query.status !== undefined ? req.query.status === 'true' : undefined,
        showOnHome: req.query.showOnHome !== undefined ? req.query.showOnHome === 'true' : undefined,
        search: req.query.search,
      };
      const paginationRequested = req.query.page !== undefined || req.query.limit !== undefined;
      if (paginationRequested) {
        const { page, limit, skip } = parsePagination(req.query);
        const [services, total] = await Promise.all([
          serviceService.list(locale, { ...filterOptions, limit, offset: skip }),
          serviceService.count(filterOptions),
        ]);
        res.json({
          data: services,
          pagination: buildPaginationMeta(page, limit, total),
        });
      } else {
        const services = await serviceService.list(locale, filterOptions);
        res.json(services);
      }
    } catch (error) {
      next(error);
    }
  },

  async getBySlug(req, res, next) {
    try {
      const { slug } = req.params;
      const locale = req.language || 'en';
      const service = await serviceService.findBySlug(slug, locale);
      
      if (!service) {
        return res.status(404).json({ error: 'Service not found' });
      }
      
      res.json(service);
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      // Return all translations so admin edit form can load every locale (en, id, ar, etc.)
      const service = await serviceService.findByIdWithAllTranslations(parseInt(id));
      
      if (!service) {
        return res.status(404).json({ error: 'Service not found' });
      }
      
      res.json(service);
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const service = await serviceService.create(req.body);
      res.status(201).json(service);
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const service = await serviceService.update(parseInt(id), req.body);
      res.json(service);
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await serviceService.delete(parseInt(id));
      res.json({ success: true, message: 'Service deleted successfully' });
    } catch (error) {
      next(error);
    }
  },
};
