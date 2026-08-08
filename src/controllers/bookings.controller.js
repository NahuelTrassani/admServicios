import BookingManager from "../managers/BookingManager.js";
import ServiceManager from "../managers/ServiceManager.js";

const bookingManager = new BookingManager();
const serviceManager = new ServiceManager();

export const createBooking = async (req, res) => {
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
};

export const getBookingById = async (req, res) => {
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
};

export const addServiceToBooking = async (req, res) => {
  const bookingId = req.params.bid;
  const serviceId = req.params.sid;
  try {
    //se valida cada uno por separado para poder informar cual de los dos falta
    const booking = await bookingManager.getBookingById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: "Reserva no encontrada" });
    }

    const service = await serviceManager.getServiceById(serviceId);
    if (!service) {
      return res.status(404).json({ error: "Servicio no encontrado" });
    }

    const updatedBooking = await bookingManager.addServiceToBooking(
      bookingId,
      serviceId,
    );
    res.status(200).json(updatedBooking);
  } catch (error) {
    res.status(500).json({ error: "Error al agregar el servicio a la reserva" });
  }
};
