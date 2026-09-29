import { z } from "zod";
import {
  IMAGE_SRC_MAX,
  ICON_MAX,
  SLUG_SOURCE_MAX,
} from "./schemaLimits.js";
import { ProjectCategoryTranslationSchema } from "./commonSchemas.js";

export const ProjectCategoryCreateSchema = z.object({
  imageSrc: z.string().max(IMAGE_SRC_MAX).nullable().optional(),
  icon: z.string().max(ICON_MAX).nullable().optional(),
  sort: z.number().int().nonnegative().default(0),
  status: z.boolean().default(true),
  translations: z.array(ProjectCategoryTranslationSchema),
  // nameEn is used only to generate slug when not provided explicitly in backend
  nameEn: z.string().min(1).max(SLUG_SOURCE_MAX),
});

export const ProjectCategoryUpdateSchema = ProjectCategoryCreateSchema.partial({
  imageSrc: true,
  icon: true,
  sort: true,
  status: true,
  translations: true,
  nameEn: true,
});

