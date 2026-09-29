import prisma from '../config/database.js';
import { trimStrings } from '../utils/validation.js';
import { deleteFileFromStorage } from '../utils/fileStorage.js';
import {
  DocumentBulkDeleteSchema,
  DocumentCreateSchema,
  DocumentUpdateSchema,
} from '../../../shared/schemas/documentSchemas.js';

export const documentService = {
  async findById(id) {
    return await prisma.document.findUnique({
      where: { id: parseInt(id) },
    });
  },

  async list(options = {}) {
    const { limit, offset, search } = options;
    const where = {};
    if (search != null && String(search).trim() !== '') {
      const term = String(search).trim();
      where.name = { contains: term };
    }
    return await prisma.document.findMany({
      where,
      orderBy: { sort: 'asc' },
      ...(limit !== undefined && { take: limit }),
      ...(offset !== undefined && { skip: offset }),
    });
  },

  async count(options = {}) {
    const { search } = options || {};
    const where = {};
    if (search != null && String(search).trim() !== '') {
      const term = String(search).trim();
      where.name = { contains: term };
    }
    return await prisma.document.count({ where });
  },

  async create(data) {
    const parsed = DocumentCreateSchema.parse(data);
    const trimmed = trimStrings(parsed);

    const doc = await prisma.document.create({
      data: {
        name: trimmed.name,
        src: trimmed.src,
        sort: trimmed.sort !== undefined && trimmed.sort !== null ? parseInt(trimmed.sort, 10) : 0,
      },
    });

    return await this.findById(doc.id);
  },

  async update(id, data) {
    const parsed = DocumentUpdateSchema.parse(data);
    const trimmed = trimStrings(parsed);

    const updateData = {};
    if (trimmed.name !== undefined) updateData.name = trimmed.name;
    if (trimmed.src !== undefined) updateData.src = trimmed.src;
    if (trimmed.sort !== undefined) updateData.sort = parseInt(trimmed.sort, 10);
    updateData.updatedAt = new Date();

    await prisma.document.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    return await this.findById(id);
  },

  async delete(id) {
    const doc = await prisma.document.findUnique({
      where: { id: parseInt(id) },
    });
    const result = await prisma.document.delete({
      where: { id: parseInt(id) },
    });
    if (doc?.src) await deleteFileFromStorage(doc.src);
    return result;
  },

  async deleteMany(data) {
    const { ids } = DocumentBulkDeleteSchema.parse(data);
    const uniqueIds = [...new Set(ids.map((id) => parseInt(id, 10)))];

    const docs = await prisma.document.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, src: true },
    });

    const existingIds = docs.map((doc) => doc.id);
    if (existingIds.length === 0) {
      return {
        requestedCount: uniqueIds.length,
        deletedCount: 0,
        deletedIds: [],
      };
    }

    await prisma.document.deleteMany({
      where: { id: { in: existingIds } },
    });

    await Promise.allSettled(
      docs
        .map((doc) => doc.src)
        .filter(Boolean)
        .map((src) => deleteFileFromStorage(src))
    );

    return {
      requestedCount: uniqueIds.length,
      deletedCount: existingIds.length,
      deletedIds: existingIds,
    };
  },
};

