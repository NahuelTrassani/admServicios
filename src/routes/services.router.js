import { Router } from "express";
import {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} from "../controllers/services.controller.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../middlewares/validate.js";
import {
  createServiceSchema,
  updateServiceSchema,
  listServicesQuerySchema,
  serviceIdParamSchema,
} from "../validations/service.validation.js";

const router = Router();

router.get("/", validateQuery(listServicesQuerySchema), getServices);
router.get("/:id", validateParams(serviceIdParamSchema), getServiceById);
router.post("/", validateBody(createServiceSchema), createService);
router.put(
  "/:id",
  validateParams(serviceIdParamSchema),
  validateBody(updateServiceSchema),
  updateService,
);
router.delete("/:id", validateParams(serviceIdParamSchema), deleteService);

export default router;
