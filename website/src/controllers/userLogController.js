import prisma from '../config/database.js';

export const userLogController = {
  async list(req, res, next) {
    try {
      const {
        userId,
        username,
        endpoint,
        httpMethod,
        statusCode,
        page = 1,
        pageSize = 20,
        startDate,
        endDate,
        ipAddress,
        executionTimeMin,
        executionTimeMax,
      } = req.query;

      const where = {};

      if (userId) {
        where.userId = parseInt(userId);
      }
      if (username && username.trim()) {
        where.user = { username: { contains: username.trim() } };
      }
      if (endpoint && endpoint.trim()) {
        where.endpoint = { contains: endpoint.trim() };
      }
      if (httpMethod) {
        where.httpMethod = String(httpMethod).toUpperCase();
      }
      if (statusCode) {
        where.responseStatusCode = parseInt(statusCode);
      }
      if (ipAddress && ipAddress.trim()) {
        where.ipAddress = { contains: ipAddress.trim() };
      }
      if (executionTimeMin != null && executionTimeMin !== '') {
        const min = parseInt(executionTimeMin);
        if (!isNaN(min)) where.executionTimeMs = { ...where.executionTimeMs, gte: min };
      }
      if (executionTimeMax != null && executionTimeMax !== '') {
        const max = parseInt(executionTimeMax);
        if (!isNaN(max)) where.executionTimeMs = { ...where.executionTimeMs, lte: max };
      }
      if (startDate || endDate) {
        where.createdAt = where.createdAt || {};
        if (startDate) {
          where.createdAt.gte = new Date(startDate);
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          where.createdAt.lte = end;
        }
      }

      const skip = (parseInt(page) - 1) * parseInt(pageSize);
      const take = parseInt(pageSize);

      const [logs, total] = await Promise.all([
        prisma.userLog.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
        prisma.userLog.count({ where }),
      ]);

      res.json({
        logs,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total,
          totalPages: Math.ceil(total / parseInt(pageSize)),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const log = await prisma.userLog.findUnique({
        where: { id: parseInt(id) },
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });

      if (!log) {
        return res.status(404).json({ error: 'User log not found' });
      }

      res.json(log);
    } catch (error) {
      next(error);
    }
  },
};
