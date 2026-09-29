import { z } from "zod";
import { USER_USERNAME_MAX, USER_NOTE_TO_SELF_MAX } from "./schemaLimits.js";

export const UserCreateSchema = z.object({
  username: z.string().min(1).max(USER_USERNAME_MAX),
  password: z.string().min(1),
  sort: z.number().int().nonnegative().default(0),
  status: z.boolean().default(true),
  noteToSelf: z.string().max(USER_NOTE_TO_SELF_MAX).nullable().optional(),
});

export const UserUpdateSchema = z.object({
  username: z.string().min(1).max(USER_USERNAME_MAX),
  password: z.string().optional(),
  sort: z.number().int().nonnegative().default(0),
  status: z.boolean().default(true),
  noteToSelf: z.string().max(USER_NOTE_TO_SELF_MAX).nullable().optional(),
});

