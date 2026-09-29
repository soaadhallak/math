import { z } from "zod";
import {
  IMAGE_SRC_MAX,
  ICON_MAX,
  SLUG_SOURCE_MAX,
  REFERENCE_LOGO_URL_MAX,
} from "./schemaLimits.js";
import { ProjectTranslationSchema, MediaItemSchema } from "./commonSchemas.js";

const ProjectExternalUrlSchema = z
  .union([
    z.string().url().max(REFERENCE_LOGO_URL_MAX),
    z.literal(""),
    z.null(),
  ])
  .optional()
  .transform((value) => (value === "" || value === undefined ? null : value));

export const ProjectCreateSchema = z.object({
  projectCategoryId: z.number().int().positive(),
  imageSrc: z.string().min(1).max(IMAGE_SRC_MAX),
  icon: z.string().max(ICON_MAX).nullable().optional(),
  externalUrl: ProjectExternalUrlSchema,
  sort: z.number().int().nonnegative().default(0),
  status: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  translations: z.array(ProjectTranslationSchema),
  media: z.array(MediaItemSchema),
  nameEn: z.string().min(1).max(SLUG_SOURCE_MAX),
});

export const ProjectUpdateSchema = ProjectCreateSchema.partial({
  projectCategoryId: true,
  imageSrc: true,
  icon: true,
  externalUrl: true,
  sort: true,
  status: true,
  isFeatured: true,
  translations: true,
  media: true,
  nameEn: true,
});
