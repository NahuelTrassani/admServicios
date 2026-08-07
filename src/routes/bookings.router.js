import { Router } from "express";
import BookingManager from "../managers/BookingManager.js";

const router = Router();
const bookingManager = new BookingManager();

router.post("/", async (req, res) => {
  const bookingData = req.body;
  try {
    const newBooking = await bookingManager.createBooking(bookingData);
    if (newBooking) {
      res.status(201).json(newBooking);
    } else {
      res
        .status(400)
        .json({ error: "Datos de reserva incompletos o inválidos" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error al crear la reserva" });
  }
});

router.get("/:bid", async (req, res) => {
  const bookingId = req.params.bid;
  try {
    const booking = await bookingManager.getBookingById(bookingId);
    if (booking) {
      res.status(200).json(booking);
    } else {
      res.status(404).json({ error: "Reserva no encontrada" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error al obtener la reserva" });
  }
});

router.post("/:bid/services/:sid", async (req, res) => {
  const bookingId = req.params.bid;
  const serviceId = req.params.sid;
  try {
    const booking = await bookingManager.addServiceToBooking(
      bookingId,
      serviceId
    );
    if (booking) {
      res.status(200).json(booking);
    } else {
      res.status(404).json({ error: "Reserva o servicio no encontrado" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error al agregar el servicio a la reserva" });
  }
});

export default router;
