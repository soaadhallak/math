import prisma from '../config/database.js';
import { trimStrings, validateLocale, normalizeMediaKey, normalizeSlug } from '../utils/validation.js';
import { generateUniqueSlug } from '../utils/slug.js';
import { deleteFilesFromStorage, isLocalDeletablePath } from '../utils/fileStorage.js';
import { ServiceCreateSchema, ServiceUpdateSchema } from '../../../shared/schemas/serviceSchemas.js';

export const serviceService = {
  async findBySlug(slug, locale = 'en') {
    const normalized = normalizeSlug(slug);
    const service = await prisma.service.findUnique({
      where: { slug: normalized },
      include: {
        translations: {
          where: { locale, status: true },
        },
        medias: {
          where: { status: true },
          orderBy: { sort: 'asc' },
        },
      },
    });
    return service;
  },

  async findById(id, locale = 'en') {
    const service = await prisma.service.findUnique({
      where: { id: parseInt(id) },
      include: {
        translations: {
          where: { locale, status: true },
        },
        medias: {
          where: { status: true },
          orderBy: { sort: 'asc' },
        },
      },
    });
    return service;
  },

  async list(locale = 'en', options = {}) {
    const { status, showOnHome, limit, offset, search } = options;
    const where = {};
    if (status !== undefined) where.status = status;
    if (showOnHome !== undefined) where.showOnHome = showOnHome;
    if (search != null && String(search).trim() !== '') {
      const term = String(search).trim();
      where.OR = [
        { slug: { contains: term } },
        { translations: { some: { locale: 'en', field: 'name', value: { contains: term } } } },
      ];
    }

    return await prisma.service.findMany({
      where,
      include: {
        translations: {
          where: { locale, status: true },
        },
        medias: {
          where: { status: true },
          orderBy: { sort: 'asc' },
          take: 1,
        },
      },
      orderBy: { sort: 'asc' },
      ...(limit !== undefined && { take: limit }),
      ...(offset !== undefined && { skip: offset }),
    });
  },

  async count(options = {}) {
    const { status, showOnHome, search } = options;
    const where = {};
    if (status !== undefined) where.status = status;
    if (showOnHome !== undefined) where.showOnHome = showOnHome;
    if (search != null && String(search).trim() !== '') {
      const term = String(search).trim();
      where.OR = [
        { slug: { contains: term } },
        { translations: { some: { locale: 'en', field: 'name', value: { contains: term } } } },
      ];
    }
    return await prisma.service.count({ where });
  },

  async assertHomeSlotAvailable(showOnHome, excludeId = null) {
    if (!showOnHome) return;
    const where = { showOnHome: true };
    if (excludeId != null) where.id = { not: parseInt(excludeId) };
    const count = await prisma.service.count({ where });
    if (count >= 4) {
      const err = new Error(
        'You cannot feature more than 4 services on the homepage'
      );
      err.status = 400;
      throw err;
    }
  },

  async create(data) {
    const parsed = ServiceCreateSchema.parse(data);
    const trimmed = trimStrings(parsed);
    const nameEn = trimmed.nameEn || trimmed.translations?.find(t => t.locale === 'en' && t.field === 'name')?.value;
    
    if (!nameEn) {
      throw new Error('English name is required');
    }

    const showOnHome = trimmed.showOnHome === true;
    await this.assertHomeSlotAvailable(showOnHome);

    const slug = await generateUniqueSlug(nameEn, async (slug) => {
      const existing = await prisma.service.findUnique({ where: { slug } });
      return !!existing;
    });

    const service = await prisma.service.create({
      data: {
        slug,
        imageSrc: trimmed.imageSrc,
        icon: trimmed.icon || null,
        sort: trimmed.sort || 0,
        status: trimmed.status !== undefined ? trimmed.status : true,
        showOnHome,
      },
    });

    // Create translations
    if (trimmed.translations && Array.isArray(trimmed.translations)) {
      for (const translation of trimmed.translations) {
        if (validateLocale(translation.locale)) {
          await prisma.serviceTranslation.create({
            data: {
              serviceId: service.id,
              locale: translation.locale,
              field: translation.field.trim(),
              value: translation.value.trim(),
              status: true,
            },
          });
        }
      }
    }

    // Create media (use raw body array; key = kebab-case identifier; captions in service_translations with field = key)
    const mediaList = Array.isArray(data.media) ? data.media : [];
    for (let i = 0; i < mediaList.length; i++) {
      const mediaItem = mediaList[i];
      if (!mediaItem || typeof mediaItem !== 'object') continue;
      const src = (mediaItem.src != null ? String(mediaItem.src) : '').trim();
      if (!src) continue;
      const key = normalizeMediaKey((mediaItem.key ?? mediaItem.name ?? '').toString(), 50) || `media-${i + 1}`;
      await prisma.serviceMedia.create({
        data: {
          serviceId: service.id,
          key,
          isVideo: Boolean(mediaItem.isVideo),
          src,
          sort: (typeof mediaItem.sort === 'number' && !Number.isNaN(mediaItem.sort)) ? mediaItem.sort : i,
          status: true,
        },
      });
      // Media captions are stored in service_translations with field = key; they come from the main translations array (i18n per locale).
    }

    return await this.findByIdWithAllTranslations(service.id);
  },

  async findByIdWithAllTranslations(id) {
    return await prisma.service.findUnique({
      where: { id: parseInt(id) },
      include: {
        translations: true,
        medias: true,
      },
    });
  },

  async update(id, data) {
    const parsed = ServiceUpdateSchema.parse(data);
    const trimmed = trimStrings(parsed);
    const updateData = {};

    if (trimmed.imageSrc) updateData.imageSrc = trimmed.imageSrc;
    if (trimmed.icon !== undefined) updateData.icon = trimmed.icon;
    if (trimmed.sort !== undefined) updateData.sort = parseInt(trimmed.sort);
    if (trimmed.status !== undefined) updateData.status = trimmed.status;
    if (trimmed.showOnHome !== undefined) {
      await this.assertHomeSlotAvailable(trimmed.showOnHome === true, id);
      updateData.showOnHome = trimmed.showOnHome === true;
    }

    await prisma.service.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    // Update translations
    if (trimmed.translations && Array.isArray(trimmed.translations)) {
      for (const translation of trimmed.translations) {
        if (validateLocale(translation.locale)) {
          await prisma.serviceTranslation.upsert({
            where: {
              serviceId_locale_field: {
                serviceId: parseInt(id),
                locale: translation.locale,
                field: translation.field.trim(),
              },
            },
            update: {
              value: translation.value.trim(),
            },
            create: {
              serviceId: parseInt(id),
              locale: translation.locale,
              field: translation.field.trim(),
              value: translation.value.trim(),
              status: true,
            },
          });
        }
      }
    }

    // Sync media: replace all service medias with payload (use raw body array)
    const mediaList = Array.isArray(data.media) ? data.media : [];
    await prisma.serviceMedia.deleteMany({ where: { serviceId: parseInt(id) } });
    for (let i = 0; i < mediaList.length; i++) {
      const mediaItem = mediaList[i];
      if (!mediaItem || typeof mediaItem !== 'object') continue;
      const src = (mediaItem.src != null ? String(mediaItem.src) : '').trim();
      if (!src) continue;
      const key = normalizeMediaKey((mediaItem.key ?? mediaItem.name ?? '').toString(), 50) || `media-${i + 1}`;
      await prisma.serviceMedia.create({
        data: {
          serviceId: parseInt(id),
          key,
          isVideo: Boolean(mediaItem.isVideo),
          src,
          sort: (typeof mediaItem.sort === 'number' && !Number.isNaN(mediaItem.sort)) ? mediaItem.sort : i,
          status: true,
        },
      });
      // Media captions are in service_translations (field = key); they come from the main translations array (i18n per locale).
    }

    return await this.findByIdWithAllTranslations(id);
  },

  async delete(id) {
    const service = await prisma.service.findUnique({
      where: { id: parseInt(id) },
      include: { medias: true },
    });
    const result = await prisma.service.delete({
      where: { id: parseInt(id) },
    });
    const paths = [];
    if (service?.imageSrc && isLocalDeletablePath(service.imageSrc)) paths.push(service.imageSrc);
    if (service?.medias) service.medias.forEach((m) => { if (m.src && isLocalDeletablePath(m.src)) paths.push(m.src); });
    await deleteFilesFromStorage(paths);
    return result;
  },
};
