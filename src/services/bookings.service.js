import bookingsRepository from "../repositories/bookings.repository.js";
import { ESTADOS_ACTIVOS } from "../models/booking.model.js";
import { getServiceById } from "./services.service.js";
import {
  esErrorDeValidacion,
  esClaveDuplicada,
  TurnoOcupadoError,
} from "../utils/errors.js";

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

//guarda los servicios de la reserva y traduce un rechazo del schema a null
const guardarServicios = async (bookingId, services) => {
  try {
    return await bookingsRepository.update(bookingId, { services });
  } catch (error) {
    if (esErrorDeValidacion(error)) {
      return null;
    }
    throw error;
  }
};

const buscarItem = (booking, serviceId) =>
  booking.services.find((item) => item.service.toString() === serviceId);

export const createBooking = async (data) => {
  if (!data) {
    return null;
  }

  //el service responde si el turno esta libre, para avisarle al usuario antes de escribir
  if (ESTADOS_ACTIVOS.includes(data.status ?? "pendiente")) {
    const ocupado = await bookingsRepository.getActiveBySlot(data.date, data.time);
    if (ocupado) {
      throw new TurnoOcupadoError(data.date, data.time);
    }
  }

  try {
    return await bookingsRepository.create(data);
  } catch (error) {
    //dos pedidos simultaneos pasan la consulta de arriba: el indice unico frena al segundo
    if (esClaveDuplicada(error)) {
      throw new TurnoOcupadoError(data.date, data.time);
    }
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
  const existing = buscarItem(booking, serviceId);

  if (existing) {
    //si ya estaba, suma cantidad
    existing.quantity += 1;
  } else {
    booking.services.push({
      service: serviceId,
      quantity: 1,
    });
  }

  return guardarServicios(bookingId, booking.services);
};

export const updateServiceQuantity = async (bookingId, serviceId, quantity) => {
  const booking = await bookingsRepository.getById(bookingId);
  if (!booking) {
    return null;
  }

  //solo se modifica un servicio que ya forma parte de la reserva
  const item = buscarItem(booking, serviceId);
  if (!item) {
    return null;
  }

  item.quantity = quantity;
  return guardarServicios(bookingId, booking.services);
};

export const removeServiceFromBooking = async (bookingId, serviceId) => {
  const booking = await bookingsRepository.getById(bookingId);
  if (!booking || !buscarItem(booking, serviceId)) {
    return null;
  }

  const restantes = booking.services.filter(
    (item) => item.service.toString() !== serviceId,
  );
  return guardarServicios(bookingId, restantes);
};

//vaciar deja la reserva y su turno, sin servicios asociados
export const emptyBooking = async (bookingId) => {
  const booking = await bookingsRepository.getById(bookingId);
  if (!booking) {
    return null;
  }

  return guardarServicios(bookingId, []);
};

//borrado fisico: ningun documento referencia a una reserva, y el turno queda libre
export const deleteBooking = async (bookingId) => {
  return bookingsRepository.delete(bookingId);
};
