import fs from "fs/promises";

class ServiceManager {
  constructor() {
    this.path = "./src/data/services.json";
  }

  async getServices() {
    try {
      const data = await fs.readFile(this.path, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  async addService(serviceData) {
    const services = await this.getServices();

    //no acepta campos vacios
    if (
      !serviceData ||
      !serviceData.name ||
      !serviceData.description ||
      serviceData.duration === undefined ||
      serviceData.price === undefined ||
      !serviceData.category ||
      serviceData.available === undefined
    ) {
      return null;
    }

    // generar id si hay servicios, ultimo id + 1
    //  si no, 1
    const newId =
      services.length > 0 ? Math.max(...services.map((s) => s.id)) + 1 : 1; //busca el id mas alto

    //inicializa
    const newService = { id: newId, ...serviceData };
    services.push(newService);

    //escribe el en archivo el nuevo servicio
    await fs.writeFile(this.path, JSON.stringify(services, null, 2));

    //retorna el nuevo servicio
    return newService;
  }

  async getServiceById(id) {
    const numberId = parseInt(id);
    if (isNaN(numberId)) {
      return null;
    }
    const services = await this.getServices();
    const service = services.find((s) => s.id === numberId);
    return service || null;
  }

  async updateService(id, updatedData) {
    const numberId = parseInt(id);
    if (isNaN(numberId)) {
      return null;
    }
    const services = await this.getServices();
    const index = services.findIndex((s) => s.id === numberId);
    if (index === -1) {
      return null;
    }
    services[index] = {
      ...services[index],
      ...updatedData,
      id: services[index].id,
    };
    await fs.writeFile(this.path, JSON.stringify(services, null, 2));
    return services[index];
  }

  //baja logica
  async deleteService(id) {
    const numberId = parseInt(id);
    if (isNaN(numberId)) {
      return null;
    }
    const services = await this.getServices();
    const index = services.findIndex((s) => s.id === numberId);
    if (index === -1) {
      return null;
    }
    // const deleted = services.splice(index, 1)[0] //borrado fisico
    services[index].available = false;
    await fs.writeFile(this.path, JSON.stringify(services, null, 2));
    return services[index];
  }
}

export default ServiceManager;
