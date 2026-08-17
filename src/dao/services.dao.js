import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

//se arma la ruta desde la ubicacion de este archivo y no desde donde se ejecuta node
const __dirname = path.dirname(fileURLToPath(import.meta.url));

class ServicesDao {
  constructor() {
    this.path = path.join(__dirname, "../data/services.json");
  }

  async getAll() {
    try {
      const data = await fs.readFile(this.path, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  async getById(id) {
    const numberId = parseInt(id);
    if (isNaN(numberId)) {
      return null;
    }
    const services = await this.getAll();
    const service = services.find((s) => s.id === numberId);
    return service || null;
  }

  async create(data) {
    const services = await this.getAll();

    const newId =
      services.length > 0 ? Math.max(...services.map((s) => s.id)) + 1 : 1; //busca el id mas alto

    //el id generado va al final para que no lo pise un id enviado en el body
    const newService = { ...data, id: newId };
    services.push(newService);

    //escribe el en archivo el nuevo servicio
    await fs.writeFile(this.path, JSON.stringify(services, null, 2));

    //retorna el nuevo servicio
    return newService;
  }

  async update(id, updatedData) {
    const numberId = parseInt(id);
    if (isNaN(numberId)) {
      return null;
    }
    const services = await this.getAll();
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

  // se usa el update para dar baja logica.
  //   async delete(id) {
  //     const numberId = parseInt(id);
  //     if (isNaN(numberId)) {
  //       return null;
  //     }
  //     const services = await this.getAll();
  //     const index = services.findIndex((s) => s.id === numberId);
  //     if (index === -1) {
  //       return null;
  //     }
  //     // const deleted = services.splice(index, 1)[0] //borrado fisico
  //     services[index].available = false;
  //     await fs.writeFile(this.path, JSON.stringify(services, null, 2));
  //     return services[index];
  //   }
}

export default new ServicesDao();
