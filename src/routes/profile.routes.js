import { Router } from "express";
import * as controller from "../controllers/profile.controller.js";
import { validateProfileInput, validateQueryParams } from "../middleware/validator.js";
import { authorize } from "../middleware/role.middleware.js";

const router = Router();

// Admin Only
router.post("/", authorize('admin'), validateProfileInput, controller.postProfile);
router.delete("/:id", authorize('admin'), controller.deleteProfile);

// Analyst & Admin
router.get("/", validateQueryParams, controller.getProfiles);
router.get("/search", validateQueryParams, controller.searchProfiles);
router.get("/export", controller.exportProfiles);
router.get("/:id", controller.getProfile);

export default router;