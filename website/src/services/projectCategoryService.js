import prisma from '../config/database.js';
import { trimStrings, validateLocale, validateSlug, normalizeSlug } from '../utils/validation.js';
import { generateUniqueSlug } from '../utils/slug.js';
import { deleteFileFromStorage, isLocalDeletablePath } from '../utils/fileStorage.js';
import { ProjectCategoryCreateSchema, ProjectCategoryUpdateSchema } from '../../../shared/schemas/projectCategorySchemas.js';

export const projectCategoryService = {
  async findById(id, locale = 'en') {
    const category = await prisma.projectCategory.findUnique({
      where: { id: parseInt(id) },
      include: {
        translations: {
          where: { locale, status: true },
        },
        projects: {
          where: { status: true },
          include: {
            translations: {
              where: { locale, status: true, field: 'name' },
            },
          },
          orderBy: { sort: 'asc' },
          take: 10,
        },
      },
    });
    return category;
  },

  async findBySlug(slug, locale = 'en') {
    const normalized = normalizeSlug(slug);
    const category = await prisma.projectCategory.findUnique({
      where: { slug: normalized },
      include: {
        translations: {
          where: { locale, status: true },
        },
        projects: {
          where: { status: true },
          include: {
            translations: {
              where: { locale, status: true, field: 'name' },
            },
          },
          orderBy: { sort: 'asc' },
          take: 10,
        },
      },
    });
    return category;
  },

  async list(locale = 'en', options = {}) {
    const { status, limit, offset, search } = options;
    const where = {};
    if (status !== undefined) where.status = status;
    if (search != null && String(search).trim() !== '') {
      const term = String(search).trim();
      where.OR = [
        { slug: { contains: term } },
        { translations: { some: { locale: 'en', field: 'name', value: { contains: term } } } },
      ];
    }

    return await prisma.projectCategory.findMany({
      where,
      include: {
        translations: {
          where: { locale, status: true },
        },
        _count: {
          select: { projects: { where: { status: true } } },
        },
      },
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
        { slug: { contains: term } },
        { translations: { some: { locale: 'en', field: 'name', value: { contains: term } } } },
      ];
    }
    return await prisma.projectCategory.count({ where });
  },

  async create(data) {
    const parsed = ProjectCategoryCreateSchema.parse(data);
    const trimmed = trimStrings(parsed);
    const nameEn = trimmed.nameEn || trimmed.translations?.find(t => t.locale === 'en' && t.field === 'name')?.value;
    const inputSlug = trimmed.slug;

    if (!inputSlug && !nameEn) {
      throw new Error('English name is required to generate a slug');
    }

    let slug = inputSlug ? normalizeSlug(inputSlug) : '';
    if (slug) {
      if (!validateSlug(slug)) {
        throw new Error('Slug must be 5-100 chars and use lowercase letters, numbers, and hyphens only (no spaces)');
      }
      const existing = await prisma.projectCategory.findUnique({ where: { slug } });
      if (existing) {
        throw new Error('Slug already exists');
      }
    } else {
      slug = await generateUniqueSlug(nameEn, async (candidate) => {
        const existing = await prisma.projectCategory.findUnique({ where: { slug: candidate } });
        return !!existing;
      });
      if (!validateSlug(slug)) {
        throw new Error('Slug must be 5-100 chars and use lowercase letters, numbers, and hyphens only');
      }
    }

    const category = await prisma.projectCategory.create({
      data: {
        slug,
        imageSrc: trimmed.imageSrc || null,
        icon: trimmed.icon || null,
        sort: trimmed.sort || 0,
        status: trimmed.status !== undefined ? trimmed.status : true,
      },
    });

    // Create translations
    if (trimmed.translations && Array.isArray(trimmed.translations)) {
      for (const translation of trimmed.translations) {
        if (validateLocale(translation.locale)) {
          await prisma.projectCategoryTranslation.create({
            data: {
              projectCategoryId: category.id,
              locale: translation.locale,
              field: translation.field.trim(),
              value: translation.value.trim(),
              status: true,
            },
          });
        }
      }
    }

    return await this.findByIdWithAllTranslations(category.id);
  },

  async findByIdWithAllTranslations(id) {
    return await prisma.projectCategory.findUnique({
      where: { id: parseInt(id) },
      include: {
        translations: true,
        _count: { select: { projects: true } },
      },
    });
  },

  async update(id, data) {
    const parsed = ProjectCategoryUpdateSchema.parse(data);
    const trimmed = trimStrings(parsed);
    const updateData = {};

    if (trimmed.slug !== undefined) {
      const normalizedSlug = normalizeSlug(trimmed.slug);
      if (!validateSlug(normalizedSlug)) {
        throw new Error('Slug must be 5-100 chars and use lowercase letters, numbers, and hyphens only (no spaces)');
      }
      const existing = await prisma.projectCategory.findUnique({ where: { slug: normalizedSlug } });
      if (existing && existing.id !== parseInt(id)) {
        throw new Error('Slug already exists');
      }
      updateData.slug = normalizedSlug;
    }
    if (trimmed.imageSrc !== undefined) updateData.imageSrc = trimmed.imageSrc;
    if (trimmed.icon !== undefined) updateData.icon = trimmed.icon;
    if (trimmed.sort !== undefined) updateData.sort = parseInt(trimmed.sort);
    if (trimmed.status !== undefined) updateData.status = trimmed.status;

    await prisma.projectCategory.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    // Update translations
    if (trimmed.translations && Array.isArray(trimmed.translations)) {
      for (const translation of trimmed.translations) {
        if (validateLocale(translation.locale)) {
          await prisma.projectCategoryTranslation.upsert({
            where: {
              projectCategoryId_locale_field: {
                projectCategoryId: parseInt(id),
                locale: translation.locale,
                field: translation.field.trim(),
              },
            },
            update: {
              value: translation.value.trim(),
            },
            create: {
              projectCategoryId: parseInt(id),
              locale: translation.locale,
              field: translation.field.trim(),
              value: translation.value.trim(),
              status: true,
            },
          });
        }
      }
    }

    return await this.findByIdWithAllTranslations(id);
  },

  async delete(id) {
    const category = await prisma.projectCategory.findUnique({
      where: { id: parseInt(id) },
    });
    const result = await prisma.projectCategory.delete({
      where: { id: parseInt(id) },
    });
    if (category?.imageSrc && isLocalDeletablePath(category.imageSrc)) await deleteFileFromStorage(category.imageSrc);
    return result;
  },
};
