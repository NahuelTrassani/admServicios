import mongoose from "mongoose";
import Service from "../models/service.model.js";

class ServicesDao {
  async getAll() {
    return Service.find();
  }

  async getById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return Service.findById(id);
  }

  async create(data) {
    return Service.create(data);
  }

  async update(id, data) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return Service.findByIdAndUpdate(id, data, { returnDocument: "after" });
  }
}

export default new ServicesDao();
