import express from "express";
import { publicController } from "../../controllers/publicController.js";

const router = express.Router();

router.get("/", publicController.home);
router.get("/about", publicController.about);
router.get("/services", publicController.services);
router.get("/services/:slug", publicController.serviceDetail);
router.get("/projects", publicController.projects);
router.get("/contact", publicController.contact);
router.get("/linktree", publicController.linktree);
router.get("/terms", publicController.terms);
router.get("/privacy", publicController.privacy);

export default router;
