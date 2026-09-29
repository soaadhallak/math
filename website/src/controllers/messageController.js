import { messageService } from '../services/messageService.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';
import { getClientIp } from '../config/rateLimit.js';

export const messageController = {
  /** Public — accept a contact-form submission and persist it. */
  async submit(req, res, next) {
    try {
      const meta = {
        ipAddress: getClientIp(req),
        userAgent: req.get('user-agent') || null,
      };
      const created = await messageService.create(req.body, meta);
      res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        id: created.id,
      });
    } catch (error) {
      next(error);
    }
  },

  /** Admin — paginated/filterable list. */
  async list(req, res, next) {
    try {
      const filterOptions = {};
      if (req.query.isRead !== undefined) filterOptions.isRead = req.query.isRead === 'true';
      if (req.query.search !== undefined) filterOptions.search = req.query.search;

      const paginationRequested = req.query.page !== undefined || req.query.limit !== undefined;
      if (paginationRequested) {
        const { page, limit, skip } = parsePagination(req.query);
        const [items, total] = await Promise.all([
          messageService.listForAdmin({ ...filterOptions, limit, offset: skip }),
          messageService.countForAdmin(filterOptions),
        ]);
        res.json({
          data: items,
          pagination: buildPaginationMeta(page, limit, total),
        });
      } else {
        res.json(await messageService.listForAdmin(filterOptions));
      }
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const item = await messageService.findById(req.params.id);
      if (!item) return res.status(404).json({ error: 'Message not found' });
      res.json(item);
    } catch (error) {
      next(error);
    }
  },

  async markRead(req, res, next) {
    try {
      const isRead = req.body?.isRead !== undefined ? !!req.body.isRead : true;
      const updated = await messageService.markRead(req.params.id, isRead);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      await messageService.delete(req.params.id);
      res.json({ success: true, message: 'Message deleted successfully' });
    } catch (error) {
      next(error);
    }
  },
};
