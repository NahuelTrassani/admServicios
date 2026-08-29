import bookingsRepository from "../repositories/bookings.repository.js";
import { getServiceById } from "./services.service.js";

export const getBookings = async () => {
  return bookingsRepository.getAll();
};

export const getBookingById = async (id) => {
  return bookingsRepository.getById(id);
};

export const createBooking = async (data) => {
  //no acepta campos vacios -- negocio
  if (
    !data ||
    !data.clientName ||
    !data.clientEmail ||
    !data.date ||
    !data.time ||
    !data.status
  ) {
    return null;
  }

  return bookingsRepository.create(data);
};

export const addServiceToBooking = async (bookingId, serviceId) => {
  const booking = await bookingsRepository.getById(bookingId);
  if (!booking) {
    return null;
  }

  const service = await getServiceById(serviceId);
  if (!service) {
    return null;
  }

  //se guarda solo el id del servicio y la cantidad
  const existing = booking.services.find(
    (item) => item.service.toString() === serviceId,
  );

  if (existing) {
    //si ya estaba, suma cantidad
    existing.quantity += 1;
  } else {
    booking.services.push({
      service: serviceId,
      quantity: 1,
    });
  }

  return bookingsRepository.update(bookingId, {
    services: booking.services,
  });
};
