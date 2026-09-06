import mongoose from "mongoose";
import Message from "../models/message.model.js";

class MessagesDao {
  async getAll() {
    return Message.find();
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
