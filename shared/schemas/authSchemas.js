import { z } from "zod";
import { USER_USERNAME_MAX } from "./schemaLimits.js";

export const AuthLoginSchema = z.object({
  username: z.string().min(1, "Username is required").max(USER_USERNAME_MAX),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.union([z.boolean(), z.string()]).optional(),
});

