import { Router } from "express";
import {
  createBooking,
  getBookingById,
  addServiceToBooking,
} from "../controllers/bookings.controller.js";

const router = Router();

router.post("/", createBooking);
router.get("/:bid", getBookingById);
router.post("/:bid/services/:sid", addServiceToBooking);

export default router;
