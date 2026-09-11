import mongoose from "mongoose";
import Booking from "../models/booking.model.js";

class BookingsDao {
  //populate resuelve la referencia y trae el servicio completo en vez del ObjectId.
  //lo usan las vistas: la API REST guarda y devuelve la referencia
  async getAllPopulated() {
    return Booking.find().populate("services.service");
  }

  async getById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return Booking.findById(id);
  }

  async getByIdPopulated(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return Booking.findById(id).populate("services.service");
  }

  async create(data) {
    return Booking.create(data);
  }

  async update(id, data) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return Booking.findByIdAndUpdate(id, data, { returnDocument: "after" });
  }
}

export default new BookingsDao();
