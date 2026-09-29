import { z } from "zod";
import { DOCUMENT_NAME_MAX, DOCUMENT_SRC_MAX } from "./schemaLimits.js";

export const DocumentCreateSchema = z.object({
  name: z.string().min(5).max(DOCUMENT_NAME_MAX),
  src: z.string().min(5).max(DOCUMENT_SRC_MAX),
  sort: z.number().int().nonnegative().default(0),
});

export const DocumentUpdateSchema = DocumentCreateSchema.partial({
  name: true,
  src: true,
  sort: true,
});

export const DocumentBulkDeleteSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1),
});

