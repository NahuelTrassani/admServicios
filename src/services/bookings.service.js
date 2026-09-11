import bookingsRepository from "../repositories/bookings.repository.js";
import { getServiceById } from "./services.service.js";
import { esErrorDeValidacion } from "../utils/errors.js";

//devuelve las reservas con los datos del servicio resueltos, para mostrarlas en las vistas
export const getBookingsWithServices = async () => {
  return bookingsRepository.getAllPopulated();
};

//la vista muestra el nombre de cada servicio, no el ObjectId
export const getBookingWithServices = async (id) => {
  return bookingsRepository.getByIdPopulated(id);
};

export const getBookingById = async (id) => {
  return bookingsRepository.getById(id);
};

export const createBooking = async (data) => {
  if (!data) {
    return null;
  }

  try {
    return await bookingsRepository.create(data);
  } catch (error) {
    //el schema rechazo el dato: es culpa del cliente, no del servidor
    if (esErrorDeValidacion(error)) {
      return null;
    }
    throw error;
  }
};

export const addServiceToBooking = async (bookingId, serviceId) => {
  const booking = await bookingsRepository.getById(bookingId);
  if (!booking) {
    return null;
  }

  //el servicio tiene que existir para poder asociarlo
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

  try {
    return await bookingsRepository.update(bookingId, {
      services: booking.services,
    });
  } catch (error) {
    if (esErrorDeValidacion(error)) {
      return null;
    }
    throw error;
  }
};
