import { z } from "zod";
import {
  LOCALE_CODE_LEN,
  SERVICE_TRANSLATION_FIELD_MAX,
  PROJECT_CATEGORY_TRANSLATION_FIELD_MAX,
  PROJECT_CATEGORY_TRANSLATION_VALUE_MAX,
  PROJECT_TRANSLATION_FIELD_MAX,
  MEDIA_KEY_MAX,
  MEDIA_SRC_MAX,
} from "./schemaLimits.js";

// Supported locales (matches website/src/utils/validation.js)
export const supportedLocales = ["en", "id", "ar", "tr", "fr", "de", "zh"];

export const LocaleSchema = z
  .string()
  .length(LOCALE_CODE_LEN)
  .refine((val) => supportedLocales.includes(val), {
    message: "Unsupported locale",
  });

export const ServiceTranslationSchema = z.object({
  locale: LocaleSchema,
  field: z.string().min(1).max(SERVICE_TRANSLATION_FIELD_MAX),
  value: z.string().min(1),
});

export const ProjectTranslationSchema = z.object({
  locale: LocaleSchema,
  field: z.string().min(1).max(PROJECT_TRANSLATION_FIELD_MAX),
  value: z.string().min(1),
});

export const ProjectCategoryTranslationSchema = z.object({
  locale: LocaleSchema,
  field: z.string().min(1).max(PROJECT_CATEGORY_TRANSLATION_FIELD_MAX),
  value: z.string().min(1).max(PROJECT_CATEGORY_TRANSLATION_VALUE_MAX),
});

export const MediaItemSchema = z.object({
  key: z.string().min(1).max(MEDIA_KEY_MAX),
  src: z.string().min(1).max(MEDIA_SRC_MAX),
  isVideo: z.boolean(),
  sort: z.number().int().optional(),
});

