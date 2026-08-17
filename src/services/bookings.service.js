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
  const numberBookingId = parseInt(bookingId);
  const numberServiceId = parseInt(serviceId);
  if (isNaN(numberBookingId) || isNaN(numberServiceId)) {
    return null;
  }

  // const bookings = await bookingsRepository.getAll();
  // const index = bookings.findIndex((b) => b.id === numberBookingId);
  // if (index === -1) {
  //   return null;
  // }

  const booking = await bookingsRepository.getById(numberBookingId);
  if (!booking) {
    return null;
  }

  //el servicio tiene que existir en services.json
  const service = await getServiceById(numberServiceId);
  if (!service) {
    return null;
  }

  //se guarda solo el id del servicio y la cantidad
  const existing = booking.services.find(
    (item) => item.service === numberServiceId,
  );

  if (existing) {
    //si ya estaba, suma cantidad
    existing.quantity += 1;
  } else {
    booking.services.push({
      service: numberServiceId,
      quantity: 1,
    });
  }

  return bookingsRepository.update(numberBookingId, {
    services: booking.services,
  });
};
