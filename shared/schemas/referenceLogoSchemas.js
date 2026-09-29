import { z } from "zod";
import {
  REFERENCE_LOGO_NAME_MAX,
  REFERENCE_LOGO_URL_MAX,
  REFERENCE_LOGO_IMAGE_SRC_MAX,
  REFERENCE_LOGO_ALT_MAX,
} from "./schemaLimits.js";

export const ReferenceLogoCreateSchema = z.object({
  name: z.string().min(1).max(REFERENCE_LOGO_NAME_MAX),
  url: z
    .string()
    .url()
    .max(REFERENCE_LOGO_URL_MAX)
    .nullable()
    .optional(),
  imageSrc: z.string().min(1).max(REFERENCE_LOGO_IMAGE_SRC_MAX),
  alt: z.string().min(1).max(REFERENCE_LOGO_ALT_MAX),
  sort: z.number().int().nonnegative().default(0),
  status: z.boolean().default(true),
});

export const ReferenceLogoUpdateSchema = ReferenceLogoCreateSchema.partial({
  name: true,
  url: true,
  imageSrc: true,
  alt: true,
  sort: true,
  status: true,
});

