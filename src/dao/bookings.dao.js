import mongoose from "mongoose";
import Booking from "../models/booking.model.js";

class BookingsDao {
  async getAll() {
    return Booking.find();
  }

  async getById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return Booking.findById(id);
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
