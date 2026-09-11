import { Router } from "express";
import {
  createBooking,
  getBookingById,
  addServiceToBooking,
} from "../controllers/bookings.controller.js";
import { validateBody, validateParams } from "../middlewares/validate.js";
import {
  createBookingSchema,
  addServiceParamsSchema,
  bookingIdParamSchema,
} from "../validations/booking.validation.js";

const router = Router();

router.post("/", validateBody(createBookingSchema), createBooking);
router.get("/:bid", validateParams(bookingIdParamSchema), getBookingById);
router.post(
  "/:bid/services/:sid",
  validateParams(addServiceParamsSchema),
  addServiceToBooking,
);

export default router;
