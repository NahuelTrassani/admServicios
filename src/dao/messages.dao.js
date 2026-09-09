import mongoose from "mongoose";
import Message from "../models/message.model.js";

class MessagesDao {
  async getAll() {
    return Message.find();
  }

  //el orden y el corte los resuelve mongo, no se traen todos los documentos
  async getLatest(limite) {
    return Message.find().sort({ createdAt: -1 }).limit(limite);
  }

  async getById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return Message.findById(id);
  }

  async create(data) {
    return Message.create(data);
  }

  async update(id, data) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return Message.findByIdAndUpdate(id, data, { returnDocument: "after" });
  }
}

export default new MessagesDao();
