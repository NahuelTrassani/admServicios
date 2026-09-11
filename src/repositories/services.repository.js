import servicesDao from "../dao/services.dao.js";

class ServicesRepository {
  constructor(dao) {
    this.dao = dao;
  }

  async count(filtro) {
    return this.dao.count(filtro);
  }

  async search(criterios) {
    return this.dao.search(criterios);
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

export default new ServicesRepository(servicesDao);
