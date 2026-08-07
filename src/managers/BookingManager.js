import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import ServiceManager from "./ServiceManager.js";

//se arma la ruta desde la ubicacion de este archivo y no desde donde se ejecuta node
const __dirname = path.dirname(fileURLToPath(import.meta.url));

class BookingManager {
  constructor() {
    this.path = path.join(__dirname, "../data/bookings.json");
    //se usa para validar que el servicio exista antes de agregarlo a una reserva
    this.serviceManager = new ServiceManager();
  }

  async getBookings() {
    try {
      const data = await fs.readFile(this.path, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  async createBooking(bookingData) {
    const bookings = await this.getBookings();

    //no acepta campos vacios
    if (
      !bookingData ||
      !bookingData.clientName ||
      !bookingData.clientEmail ||
      !bookingData.date ||
      !bookingData.time ||
      !bookingData.status
    ) {
      return null;
    }

    const newId =
      bookings.length > 0 ? Math.max(...bookings.map((b) => b.id)) + 1 : 1;

    //la reserva siempre nace sin servicios, se agregan despues
    const newBooking = {
      id: newId,
      clientName: bookingData.clientName,
      clientEmail: bookingData.clientEmail,
      date: bookingData.date,
      time: bookingData.time,
      status: bookingData.status,
      services: [],
    };

    bookings.push(newBooking);
    await fs.writeFile(this.path, JSON.stringify(bookings, null, 2));

    return newBooking;
  }

  async getBookingById(id) {
    const numberId = parseInt(id);
    if (isNaN(numberId)) {
      return null;
    }
    const bookings = await this.getBookings();
    const booking = bookings.find((b) => b.id === numberId);
    return booking || null;
  }

  async addServiceToBooking(bookingId, serviceId) {
    const numberBookingId = parseInt(bookingId);
    const numberServiceId = parseInt(serviceId);
    if (isNaN(numberBookingId) || isNaN(numberServiceId)) {
      return null;
    }

    const bookings = await this.getBookings();
    const index = bookings.findIndex((b) => b.id === numberBookingId);
    if (index === -1) {
      return null;
    }

    //el servicio tiene que existir en services.json
    const service = await this.serviceManager.getServiceById(numberServiceId);
    if (!service) {
      return null;
    }

    //se guarda solo el id del servicio y la cantidad
    const existing = bookings[index].services.find(
      (item) => item.service === numberServiceId
    );

    if (existing) {
      //si ya estaba, suma cantidad 
      existing.quantity += 1;
    } else {
      bookings[index].services.push({
        service: numberServiceId,
        quantity: 1,
      });
    }

    await fs.writeFile(this.path, JSON.stringify(bookings, null, 2));

    return bookings[index];
  }
}

export default BookingManager;
