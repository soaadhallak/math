import prisma from "../config/database.js";
import {
  trimStrings,
  validateLocale,
  normalizeMediaKey,
  normalizeSlug,
} from "../utils/validation.js";
import { generateUniqueSlug } from "../utils/slug.js";
import {
  deleteFilesFromStorage,
  isLocalDeletablePath,
} from "../utils/fileStorage.js";
import {
  ProjectCreateSchema,
  ProjectUpdateSchema,
} from "../../../shared/schemas/projectSchemas.js";

export const projectService = {
  async findBySlug(slug, locale = "en") {
    const normalized = normalizeSlug(slug);
    const project = await prisma.project.findUnique({
      where: { slug: normalized },
      include: {
        projectCategory: {
          include: {
            translations: {
              where: { locale, status: true },
            },
          },
        },
        translations: {
          where: { locale, status: true },
        },
        medias: {
          where: { status: true },
          orderBy: { sort: "asc" },
        },
      },
    });
    return project;
  },

  async findById(id, locale = "en") {
    const project = await prisma.project.findUnique({
      where: { id: parseInt(id) },
      include: {
        projectCategory: {
          include: {
            translations: {
              where: { locale, status: true },
            },
          },
        },
        translations: {
          where: { locale, status: true },
        },
        medias: {
          where: { status: true },
          orderBy: { sort: "asc" },
        },
      },
    });
    return project;
  },

  async list(locale = "en", options = {}) {
    const {
      status,
      projectCategoryId,
      projectCategorySlug,
      limit,
      offset,
      search,
      isFeatured,
    } = options;
    const where = {};
    if (status !== undefined) where.status = status;
    if (isFeatured !== undefined) where.isFeatured = isFeatured;
    if (projectCategorySlug) {
      where.projectCategory = { slug: normalizeSlug(projectCategorySlug) };
    } else if (projectCategoryId) {
      where.projectCategoryId = parseInt(projectCategoryId);
    }
    if (search != null && String(search).trim() !== "") {
      const term = String(search).trim();
      where.OR = [
        { slug: { contains: term } },
        {
          translations: {
            some: { locale: "en", field: "name", value: { contains: term } },
          },
        },
      ];
    }

    return await prisma.project.findMany({
      where,
      include: {
        projectCategory: {
          include: {
            translations: {
              where: { locale, status: true },
            },
          },
        },
        translations: {
          where: { locale, status: true },
        },
        medias: {
          where: { status: true },
          take: 1,
        },
      },
      orderBy: { sort: "asc" },
      ...(limit !== undefined && { take: limit }),
      ...(offset !== undefined && { skip: offset }),
    });
  },

  async count(options = {}) {
    const {
      status,
      projectCategoryId,
      projectCategorySlug,
      search,
      isFeatured,
    } = options;
    const where = {};
    if (status !== undefined) where.status = status;
    if (isFeatured !== undefined) where.isFeatured = isFeatured;
    if (projectCategorySlug) {
      where.projectCategory = { slug: normalizeSlug(projectCategorySlug) };
    } else if (projectCategoryId) {
      where.projectCategoryId = parseInt(projectCategoryId);
    }
    if (search != null && String(search).trim() !== "") {
      const term = String(search).trim();
      where.OR = [
        { slug: { contains: term } },
        {
          translations: {
            some: { locale: "en", field: "name", value: { contains: term } },
          },
        },
      ];
    }
    return await prisma.project.count({ where });
  },

  async create(data) {
    const parsed = ProjectCreateSchema.parse(data);
    const trimmed = trimStrings(parsed);
    const nameEn =
      trimmed.nameEn ||
      trimmed.translations?.find((t) => t.locale === "en" && t.field === "name")
        ?.value;

    if (!nameEn) {
      throw new Error("English name is required");
    }

    if (!trimmed.projectCategoryId) {
      throw new Error("Project category is required");
    }

    const slug = await generateUniqueSlug(nameEn, async (slug) => {
      const existing = await prisma.project.findUnique({ where: { slug } });
      return !!existing;
    });

    const project = await prisma.project.create({
      data: {
        slug,
        projectCategoryId: parseInt(trimmed.projectCategoryId),
        imageSrc: trimmed.imageSrc,
        icon: trimmed.icon || null,
        externalUrl: trimmed.externalUrl ?? null,
        sort: trimmed.sort || 0,
        status: trimmed.status !== undefined ? trimmed.status : true,
        isFeatured:
          trimmed.isFeatured !== undefined ? trimmed.isFeatured : false,
      },
    });

    // Create translations
    if (trimmed.translations && Array.isArray(trimmed.translations)) {
      for (const translation of trimmed.translations) {
        if (validateLocale(translation.locale)) {
          await prisma.projectTranslation.create({
            data: {
              projectId: project.id,
              locale: translation.locale,
              field: translation.field.trim(),
              value: translation.value.trim(),
              status: true,
            },
          });
        }
      }
    }

    // Create media (use raw body array; key = kebab-case identifier)
    const mediaList = Array.isArray(data.media) ? data.media : [];
    for (let i = 0; i < mediaList.length; i++) {
      const mediaItem = mediaList[i];
      if (!mediaItem || typeof mediaItem !== "object") continue;
      const src = (mediaItem.src != null ? String(mediaItem.src) : "").trim();
      if (!src) continue;
      const key =
        normalizeMediaKey(
          (mediaItem.key ?? mediaItem.name ?? "").toString(),
          50,
        ) || `media-${i + 1}`;
      await prisma.projectMedia.create({
        data: {
          projectId: project.id,
          key,
          isVideo: Boolean(mediaItem.isVideo),
          src,
          sort:
            typeof mediaItem.sort === "number" && !Number.isNaN(mediaItem.sort)
              ? mediaItem.sort
              : i,
          status: true,
        },
      });
      // Media captions are stored in project_translations with field = key; they come from the main translations array (i18n per locale).
    }

    return await this.findByIdWithAllTranslations(project.id);
  },

  async findByIdWithAllTranslations(id) {
    return await prisma.project.findUnique({
      where: { id: parseInt(id) },
      include: {
        translations: true,
        medias: true,
        projectCategory: true,
      },
    });
  },

  async update(id, data) {
    const parsed = ProjectUpdateSchema.parse(data);
    const trimmed = trimStrings(parsed);
    const updateData = {};

    if (trimmed.imageSrc) updateData.imageSrc = trimmed.imageSrc;
    if (trimmed.icon !== undefined) updateData.icon = trimmed.icon;
    if (trimmed.externalUrl !== undefined)
      updateData.externalUrl = trimmed.externalUrl;
    if (trimmed.projectCategoryId)
      updateData.projectCategoryId = parseInt(trimmed.projectCategoryId);
    if (trimmed.sort !== undefined) updateData.sort = parseInt(trimmed.sort);
    if (trimmed.status !== undefined) updateData.status = trimmed.status;
    if (trimmed.isFeatured !== undefined)
      updateData.isFeatured = trimmed.isFeatured;

    await prisma.project.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    // Update translations
    if (trimmed.translations && Array.isArray(trimmed.translations)) {
      for (const translation of trimmed.translations) {
        if (validateLocale(translation.locale)) {
          await prisma.projectTranslation.upsert({
            where: {
              projectId_locale_field: {
                projectId: parseInt(id),
                locale: translation.locale,
                field: translation.field.trim(),
              },
            },
            update: {
              value: translation.value.trim(),
            },
            create: {
              projectId: parseInt(id),
              locale: translation.locale,
              field: translation.field.trim(),
              value: translation.value.trim(),
              status: true,
            },
          });
        }
      }
    }

    // Sync media: replace all project medias with payload (use raw body array)
    const mediaList = Array.isArray(data.media) ? data.media : [];
    await prisma.projectMedia.deleteMany({
      where: { projectId: parseInt(id) },
    });
    for (let i = 0; i < mediaList.length; i++) {
      const mediaItem = mediaList[i];
      if (!mediaItem || typeof mediaItem !== "object") continue;
      const src = (mediaItem.src != null ? String(mediaItem.src) : "").trim();
      if (!src) continue;
      const key =
        normalizeMediaKey(
          (mediaItem.key ?? mediaItem.name ?? "").toString(),
          50,
        ) || `media-${i + 1}`;
      await prisma.projectMedia.create({
        data: {
          projectId: parseInt(id),
          key,
          isVideo: Boolean(mediaItem.isVideo),
          src,
          sort:
            typeof mediaItem.sort === "number" && !Number.isNaN(mediaItem.sort)
              ? mediaItem.sort
              : i,
          status: true,
        },
      });
      // Media captions are in project_translations (field = key); they come from the main translations array (i18n per locale).
    }

    return await this.findByIdWithAllTranslations(id);
  },

  async delete(id) {
    const project = await prisma.project.findUnique({
      where: { id: parseInt(id) },
      include: { medias: true },
    });
    const result = await prisma.project.delete({
      where: { id: parseInt(id) },
    });
    const paths = [];
    if (project?.imageSrc && isLocalDeletablePath(project.imageSrc))
      paths.push(project.imageSrc);
    if (project?.medias)
      project.medias.forEach((m) => {
        if (m.src && isLocalDeletablePath(m.src)) paths.push(m.src);
      });
    await deleteFilesFromStorage(paths);
    return result;
  },
};
