import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

//se arma la ruta desde la ubicacion de este archivo y no desde donde se ejecuta node
const __dirname = path.dirname(fileURLToPath(import.meta.url));

class BookingsDao {
  constructor() {
    this.path = path.join(__dirname, "../data/bookings.json");
  }

  async getAll() {
    try {
      const data = await fs.readFile(this.path, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  async getById(id) {
    const numberId = parseInt(id);
    if (isNaN(numberId)) {
      return null;
    }
    const bookings = await this.getAll();
    const booking = bookings.find((b) => b.id === numberId);
    return booking || null;
  }

  async create(data) {
    const bookings = await this.getAll();

    const newId =
      bookings.length > 0 ? Math.max(...bookings.map((b) => b.id)) + 1 : 1;

    //la reserva siempre nace sin servicios, se agregan despues
    const newBooking = {
      id: newId,
      clientName: data.clientName,
      clientEmail: data.clientEmail,
      date: data.date,
      time: data.time,
      status: data.status,
      services: [],
    };

    bookings.push(newBooking);
    await fs.writeFile(this.path, JSON.stringify(bookings, null, 2));

    return newBooking;
  }

  async update(id, data) {
    const numberId = parseInt(id);
    if (isNaN(numberId)) {
      return null;
    }
    const bookings = await this.getAll();
    const index = bookings.findIndex((b) => b.id === numberId);
    if (index === -1) {
      return null;
    }
    bookings[index] = {
      ...bookings[index],
      ...data,
      id: bookings[index].id,
    };
    await fs.writeFile(this.path, JSON.stringify(bookings, null, 2));
    return bookings[index];
  }
}

export default new BookingsDao();
