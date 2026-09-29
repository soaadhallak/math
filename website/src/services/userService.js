import prisma from '../config/database.js';
import bcrypt from 'bcrypt';
import { trimStrings } from '../utils/validation.js';
import { UserCreateSchema, UserUpdateSchema } from '../../../shared/schemas/userSchemas.js';

export const userService = {
  async findByUsername(username) {
    return await prisma.user.findUnique({
      where: { username: username.trim() },
    });
  },

  async findById(id) {
    return await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });
  },

  /** Returns user without passwordHash for API responses */
  toSafeUser(user) {
    if (!user) return null;
    const { passwordHash, ...rest } = user;
    return rest;
  },

  async create(data) {
    const parsed = UserCreateSchema.parse(data);
    const trimmed = trimStrings(parsed);
    const plainPassword = trimmed.password ?? trimmed.passwordHash;
    if (!plainPassword) {
      throw new Error('Password is required');
    }
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    return await prisma.user.create({
      data: {
        username: trimmed.username,
        passwordHash: hashedPassword,
        noteToSelf: trimmed.noteToSelf ?? null,
        sort: data.sort ?? 0,
        status: data.status !== undefined ? data.status : true,
      },
    });
  },

  async update(id, data) {
    const parsed = UserUpdateSchema.parse(data);
    const trimmed = trimStrings(parsed);
    const updateData = {
      username: trimmed.username,
      noteToSelf: trimmed.noteToSelf !== undefined ? (trimmed.noteToSelf || null) : undefined,
      sort: trimmed.sort !== undefined ? trimmed.sort : undefined,
      status: trimmed.status !== undefined ? trimmed.status : undefined,
    };
    const plainPassword = trimmed.password ?? trimmed.passwordHash;
    if (plainPassword) {
      updateData.passwordHash = await bcrypt.hash(plainPassword, 10);
    }

    return await prisma.user.update({
      where: { id: parseInt(id) },
      data: Object.fromEntries(Object.entries(updateData).filter(([, v]) => v !== undefined)),
    });
  },

  async delete(id) {
    return await prisma.user.delete({
      where: { id: parseInt(id) },
    });
  },

  async list(options = {}) {
    const { limit, offset, search, status } = options;
    const where = {};
    if (search != null && String(search).trim() !== '') {
      const term = String(search).trim();
      where.username = { contains: term };
    }
    if (status !== undefined) where.status = status === true || status === 'true';

    return await prisma.user.findMany({
      where,
      orderBy: { sort: 'asc' },
      select: {
        id: true,
        username: true,
        noteToSelf: true,
        createdAt: true,
        updatedAt: true,
        sort: true,
        status: true,
      },
      ...(limit !== undefined && { take: limit }),
      ...(offset !== undefined && { skip: offset }),
    });
  },

  async count(options = {}) {
    const { search, status } = options;
    const where = {};
    if (search != null && String(search).trim() !== '') {
      const term = String(search).trim();
      where.username = { contains: term };
    }
    if (status !== undefined) where.status = status === true || status === 'true';
    return await prisma.user.count({ where });
  },

  async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  },
};
