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

  async create(data) {
    return this.dao.create(data);
  }

  async update(id, data) {
    return this.dao.update(id, data);
  }
}

export default new BookingsRepository(bookingsDao);
