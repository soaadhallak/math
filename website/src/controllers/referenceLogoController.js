import { referenceLogoService } from '../services/referenceLogoService.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';

export const referenceLogoController = {
  async list(req, res, next) {
    try {
      const filterOptions = {
        status: req.query.status !== undefined ? req.query.status === 'true' : undefined,
        search: req.query.search,
      };
      const paginationRequested = req.query.page !== undefined || req.query.limit !== undefined;
      if (paginationRequested) {
        const { page, limit, skip } = parsePagination(req.query);
        const [logos, total] = await Promise.all([
          referenceLogoService.list({ ...filterOptions, limit, offset: skip }),
          referenceLogoService.count(filterOptions),
        ]);
        res.json({
          data: logos,
          pagination: buildPaginationMeta(page, limit, total),
        });
      } else {
        const logos = await referenceLogoService.list(filterOptions);
        res.json(logos);
      }
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const logo = await referenceLogoService.findById(parseInt(id));

      if (!logo) {
        return res.status(404).json({ error: 'Reference logo not found' });
      }

      res.json(logo);
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const logo = await referenceLogoService.create(req.body);
      res.status(201).json(logo);
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const logo = await referenceLogoService.update(parseInt(id), req.body);
      res.json(logo);
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await referenceLogoService.delete(parseInt(id));
      res.json({ success: true, message: 'Reference logo deleted successfully' });
    } catch (error) {
      next(error);
    }
  },
};
