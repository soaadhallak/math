import express from "express";
import authRoutes from "./auth.js";
import serviceRoutes from "./services.js";
import projectCategoryRoutes from "./projectCategories.js";
import projectRoutes from "./projects.js";
import referenceLogoRoutes from "./referenceLogos.js";
import uploadRoutes from "./upload.js";
import userLogRoutes from "./userLogs.js";
import userRoutes from "./users.js";
import documentRoutes from "./documents.js";
import messageRoutes from "./messages.js";
import { logUserRequest } from "../../middleware/userLogging.js";

const router = express.Router();

router.use(logUserRequest);

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/services", serviceRoutes);
router.use("/project-categories", projectCategoryRoutes);
router.use("/projects", projectRoutes);
router.use("/reference-logos", referenceLogoRoutes);
router.use("/upload", uploadRoutes);
router.use("/user-logs", userLogRoutes);
router.use("/documents", documentRoutes);
router.use("/messages", messageRoutes);

export default router;
