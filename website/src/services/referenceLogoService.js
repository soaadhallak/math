import prisma from '../config/database.js';
import { trimStrings } from '../utils/validation.js';
import { deleteFileFromStorage, isLocalDeletablePath } from '../utils/fileStorage.js';
import { ReferenceLogoCreateSchema, ReferenceLogoUpdateSchema } from '../../../shared/schemas/referenceLogoSchemas.js';

export const referenceLogoService = {
  async findById(id) {
    return await prisma.referenceLogo.findUnique({
      where: { id: parseInt(id) },
    });
  },

  async list(options = {}) {
    const { status, limit, offset, search } = options;
    const where = {};
    if (status !== undefined) where.status = status;
    if (search != null && String(search).trim() !== '') {
      const term = String(search).trim();
      where.OR = [
        { name: { contains: term } },
        { alt: { contains: term } },
      ];
    }

    return await prisma.referenceLogo.findMany({
      where,
      orderBy: { sort: 'asc' },
      ...(limit !== undefined && { take: limit }),
      ...(offset !== undefined && { skip: offset }),
    });
  },

  async count(options = {}) {
    const { status, search } = options;
    const where = {};
    if (status !== undefined) where.status = status;
    if (search != null && String(search).trim() !== '') {
      const term = String(search).trim();
      where.OR = [
        { name: { contains: term } },
        { alt: { contains: term } },
      ];
    }
    return await prisma.referenceLogo.count({ where });
  },

  async create(data) {
    const parsed = ReferenceLogoCreateSchema.parse(data);
    const trimmed = trimStrings(parsed);

    const logo = await prisma.referenceLogo.create({
      data: {
        name: trimmed.name,
        url: (trimmed.url != null && String(trimmed.url).trim() !== '') ? String(trimmed.url).trim() : null,
        imageSrc: trimmed.imageSrc,
        alt: trimmed.alt,
        sort: trimmed.sort !== undefined && trimmed.sort !== null ? parseInt(trimmed.sort, 10) : 0,
        status: trimmed.status !== undefined ? trimmed.status : true,
      },
    });

    return await this.findById(logo.id);
  },

  async update(id, data) {
    const parsed = ReferenceLogoUpdateSchema.parse(data);
    const trimmed = trimStrings(parsed);

    const updateData = {};
    if (trimmed.name !== undefined) updateData.name = trimmed.name;
    if (trimmed.url !== undefined) {
      updateData.url = (trimmed.url != null && String(trimmed.url).trim() !== '') ? String(trimmed.url).trim() : null;
    }
    if (trimmed.imageSrc !== undefined) updateData.imageSrc = trimmed.imageSrc;
    if (trimmed.alt !== undefined) updateData.alt = trimmed.alt;
    if (trimmed.sort !== undefined) updateData.sort = parseInt(trimmed.sort, 10);
    if (trimmed.status !== undefined) updateData.status = trimmed.status;

    await prisma.referenceLogo.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    return await this.findById(id);
  },

  async delete(id) {
    const logo = await prisma.referenceLogo.findUnique({
      where: { id: parseInt(id) },
    });
    const result = await prisma.referenceLogo.delete({
      where: { id: parseInt(id) },
    });
    if (logo?.imageSrc && isLocalDeletablePath(logo.imageSrc)) await deleteFileFromStorage(logo.imageSrc);
    return result;
  },
};
