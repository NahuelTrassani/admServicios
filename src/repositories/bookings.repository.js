import bookingsDao from "../dao/bookings.dao.js";

class BookingsRepository {
  constructor(dao) {
    this.dao = dao;
  }

  async getAllPopulated() {
    return this.dao.getAllPopulated();
  }

  async getByIdPopulated(id) {
    return this.dao.getByIdPopulated(id);
  }

  async getById(id) {
    return this.dao.getById(id);
  }

  async getActiveBySlot(date, time) {
    return this.dao.getActiveBySlot(date, time);
  }

  async create(data) {
    return this.dao.create(data);
  }

  async update(id, data) {
    return this.dao.update(id, data);
  }

  async delete(id) {
    return this.dao.delete(id);
  }
}

export default new BookingsRepository(bookingsDao);
