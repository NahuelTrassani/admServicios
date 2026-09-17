import * as servicesService from "../services/services.service.js";
import * as bookingService from "../services/bookings.service.js";
import { registrarActividad } from "../sockets/index.js";
import { TurnoOcupadoError } from "../utils/errors.js";

//la vista muestra el nombre de cada servicio: se emite la reserva con populate
const emitirReservaActualizada = async (req, bookingId) => {
  const conServicios = await bookingService.getBookingWithServices(bookingId);
  req.app.get("io")?.emit("reservaActualizada", conServicios);
};

export const createBooking = async (req, res) => {
  const bookingData = req.body;
  try {
    const newBooking = await bookingService.createBooking(bookingData);
    if (newBooking) {
      const io = req.app.get("io");
      const conServicios = await bookingService.getBookingWithServices(
        newBooking._id,
      );
      io?.emit("reservaCreada", conServicios);
      registrarActividad(io, "sistema", `Nueva reserva de ${newBooking.clientName}`);
      res.status(201).json(newBooking);
    } else {
      res
        .status(400)
        .json({ error: "Datos de reserva incompletos o inválidos" });
    }
  } catch (error) {
    //el pedido es valido pero choca con una reserva existente
    if (error instanceof TurnoOcupadoError) {
      return res.status(409).json({ error: error.message, turno: error.turno });
    }
    res.status(500).json({ error: "Error al crear la reserva" });
  }
};

export const getBookingById = async (req, res) => {
  const bookingId = req.params.bid;
  try {
    //la consigna pide devolver los datos completos de cada servicio asociado
    const booking = await bookingService.getBookingWithServices(bookingId);
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
    //se valida cada uno por separado para poder distinguir cual de los dos falta y mostrar el mensaje de error correcto.
    const booking = await bookingService.getBookingById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: "Reserva no encontrada" });
    }

    const service = await servicesService.getServiceById(serviceId);
    if (!service) {
      return res.status(404).json({ error: "Servicio no encontrado" });
    }

    const updatedBooking = await bookingService.addServiceToBooking(
      bookingId,
      serviceId,
    );
    await emitirReservaActualizada(req, bookingId);
    res.status(200).json(updatedBooking);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error al agregar el servicio a la reserva" });
  }
};

export const updateServiceQuantity = async (req, res) => {
  const bookingId = req.params.bid;
  const serviceId = req.params.sid;
  try {
    const booking = await bookingService.getBookingById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: "Reserva no encontrada" });
    }

    const updatedBooking = await bookingService.updateServiceQuantity(
      bookingId,
      serviceId,
      req.body.quantity,
    );
    if (!updatedBooking) {
      return res
        .status(404)
        .json({ error: "El servicio no forma parte de la reserva" });
    }

    await emitirReservaActualizada(req, bookingId);
    res.status(200).json(updatedBooking);
  } catch (error) {
    res.status(500).json({ error: "Error al modificar la cantidad" });
  }
};

export const removeServiceFromBooking = async (req, res) => {
  const bookingId = req.params.bid;
  const serviceId = req.params.sid;
  try {
    const booking = await bookingService.getBookingById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: "Reserva no encontrada" });
    }

    const updatedBooking = await bookingService.removeServiceFromBooking(
      bookingId,
      serviceId,
    );
    if (!updatedBooking) {
      return res
        .status(404)
        .json({ error: "El servicio no forma parte de la reserva" });
    }

    await emitirReservaActualizada(req, bookingId);
    res.status(200).json(updatedBooking);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error al quitar el servicio de la reserva" });
  }
};

export const emptyBooking = async (req, res) => {
  const bookingId = req.params.bid;
  try {
    const updatedBooking = await bookingService.emptyBooking(bookingId);
    if (!updatedBooking) {
      return res.status(404).json({ error: "Reserva no encontrada" });
    }

    await emitirReservaActualizada(req, bookingId);
    res.status(200).json(updatedBooking);
  } catch (error) {
    res.status(500).json({ error: "Error al vaciar la reserva" });
  }
};

export const deleteBooking = async (req, res) => {
  const bookingId = req.params.bid;
  try {
    const deleted = await bookingService.deleteBooking(bookingId);
    if (!deleted) {
      return res.status(404).json({ error: "Reserva no encontrada" });
    }

    const io = req.app.get("io");
    io?.emit("reservaEliminada", { _id: deleted._id });
    registrarActividad(io, "sistema", `Se eliminó la reserva de ${deleted.clientName}`);
    res.status(200).json(deleted);
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar la reserva" });
  }
};
