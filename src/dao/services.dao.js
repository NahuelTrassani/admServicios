import mongoose from "mongoose";
import Service from "../models/service.model.js";

class ServicesDao {
  async count(filtro = {}) {
    return Service.countDocuments(filtro);
  }

  //el filtrado, el orden y el corte los resuelve mongo: nunca se traen todos los documentos
  async search({ category, available, page, limit, sortBy, order }) {
    const filtro = {};
    if (category) filtro.category = category;
    if (available !== undefined) filtro.available = available === "true";

    const orden = { [sortBy]: order === "desc" ? -1 : 1 };
    const salteo = (page - 1) * limit;

    //las dos consultas van en paralelo: el total no depende del listado
    const [items, total] = await Promise.all([
      Service.find(filtro).sort(orden).skip(salteo).limit(limit),
      Service.countDocuments(filtro),
    ]);

    return { items, total };
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
