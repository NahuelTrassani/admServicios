import { Router } from "express";
import {
  renderServices,
  renderAvailability,
  renderActivity,
} from "../controllers/views.controller.js";

const router = Router();

router.get("/services", renderServices);
router.get("/availability", renderAvailability);
router.get("/activity", renderActivity);

export default router;
