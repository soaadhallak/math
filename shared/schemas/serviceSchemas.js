import { z } from "zod";
import { IMAGE_SRC_MAX, ICON_MAX, SLUG_SOURCE_MAX } from "./schemaLimits.js";
import { ServiceTranslationSchema, MediaItemSchema } from "./commonSchemas.js";

/** Service card visuals must be SVG montages (brand motion + palette). */
const ServiceImageSrcSchema = z
  .string()
  .min(1)
  .max(IMAGE_SRC_MAX)
  .refine((value) => /\.svg(\?[#\w.=&-]*)?$/i.test(value.trim()), {
    message: "Service image must be an SVG file (.svg)",
  });

export const ServiceCreateSchema = z.object({
  imageSrc: ServiceImageSrcSchema,
  icon: z.string().max(ICON_MAX).nullable().optional(),
  sort: z.number().int().nonnegative().default(0),
  status: z.boolean().default(true),
  showOnHome: z.boolean().default(false),
  translations: z.array(ServiceTranslationSchema),
  media: z.array(MediaItemSchema),
  nameEn: z.string().min(1).max(SLUG_SOURCE_MAX),
});

export const ServiceUpdateSchema = ServiceCreateSchema.partial({
  imageSrc: true,
  icon: true,
  sort: true,
  status: true,
  showOnHome: true,
  translations: true,
  media: true,
  nameEn: true,
});
