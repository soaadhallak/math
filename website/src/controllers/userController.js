import { userService } from '../services/userService.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';

export const userController = {
  async list(req, res, next) {
    try {
      const paginationRequested = req.query.page !== undefined || req.query.limit !== undefined;
      if (paginationRequested) {
        const { page, limit, skip } = parsePagination(req.query);
        const filterOptions = {
          search: req.query.search,
          status: req.query.status !== undefined ? req.query.status === 'true' : undefined,
        };
        const [users, total] = await Promise.all([
          userService.list({ ...filterOptions, limit, offset: skip }),
          userService.count(filterOptions),
        ]);
        res.json({
          data: users,
          pagination: buildPaginationMeta(page, limit, total),
        });
      } else {
        const filterOptions = {
          search: req.query.search,
          status: req.query.status !== undefined ? req.query.status === 'true' : undefined,
        };
        const users = await userService.list(filterOptions);
        res.json(users);
      }
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const user = await userService.findById(parseInt(id));
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(userService.toSafeUser(user));
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const user = await userService.create(req.body);
      res.status(201).json(userService.toSafeUser(user));
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const currentUserId = req.session?.userId;
      const isSelf = currentUserId && parseInt(id) === currentUserId;
      const hasPassword = !!(
        (req.body.password && req.body.password.trim()) ||
        (req.body.passwordHash && req.body.passwordHash.trim())
      );

      const user = await userService.update(parseInt(id), req.body);
      const payload = userService.toSafeUser(user);

      if (isSelf && hasPassword) {
        payload.requireLogout = true;
        payload.noteToSelf = user.noteToSelf ?? '';
      }

      res.json(payload);
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const currentUserId = req.session?.userId;
      if (currentUserId && parseInt(id) === currentUserId) {
        return res.status(400).json({ error: 'You cannot delete your own account' });
      }
      await userService.delete(parseInt(id));
      res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
      next(error);
    }
  },
};
