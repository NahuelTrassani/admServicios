import { Router } from "express";
import {
  createBooking,
  getBookingById,
  addServiceToBooking,
  updateServiceQuantity,
  removeServiceFromBooking,
  emptyBooking,
  deleteBooking,
} from "../controllers/bookings.controller.js";
import { validateBody, validateParams } from "../middlewares/validate.js";
import {
  createBookingSchema,
  bookingServiceParamsSchema,
  bookingIdParamSchema,
  updateQuantitySchema,
} from "../validations/booking.validation.js";

const router = Router();

router.post("/", validateBody(createBookingSchema), createBooking);
router.get("/:bid", validateParams(bookingIdParamSchema), getBookingById);
router.delete("/:bid", validateParams(bookingIdParamSchema), deleteBooking);

router.post(
  "/:bid/services/:sid",
  validateParams(bookingServiceParamsSchema),
  addServiceToBooking,
);
router.put(
  "/:bid/services/:sid",
  validateParams(bookingServiceParamsSchema),
  validateBody(updateQuantitySchema),
  updateServiceQuantity,
);
router.delete(
  "/:bid/services/:sid",
  validateParams(bookingServiceParamsSchema),
  removeServiceFromBooking,
);
router.delete(
  "/:bid/services",
  validateParams(bookingIdParamSchema),
  emptyBooking,
);

export default router;
