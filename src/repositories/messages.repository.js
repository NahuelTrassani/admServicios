import messagesDao from "../dao/messages.dao.js";

class MessagesRepository {
  constructor(dao) {
    this.dao = dao;
  }

  async getAll() {
    return this.dao.getAll();
  }

  async getLatest(limite) {
    return this.dao.getLatest(limite);
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

export default new MessagesRepository(messagesDao);
