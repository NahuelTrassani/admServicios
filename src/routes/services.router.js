import { Router } from "express";
import ServiceManager from "../managers/ServiceManager.js";

const router = Router();
const serviceManager = new ServiceManager();

router.get("/", async (req, res) => {
  const { category, available } = req.query;
  try {
    const services = await serviceManager.getServices();
    let result = services;
    //filtrar por req.query - category y available
    if (category) {
      result = result.filter((s) => s.category === category);
    }
    if (available) {
      result = result.filter((s) => s.available === (available === "true"));
    }
    res.status(200).json(result); //devuelve 200 y el resultado
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los servicios" }); //error 500 y msj error.
  }
});

router.get("/:id", async (req, res) => {
  const serviceId = req.params.id;
  try {
    const service = await serviceManager.getServiceById(serviceId);
    if (service) {
      res.status(200).json(service);
    } else {
      res.status(404).json({ error: "Servicio no encontrado" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el servicio" });
  }
});

router.post("/", async (req, res) => {
  const serviceData = req.body;
  try {
    const newService = await serviceManager.addService(serviceData);
    if (newService) {
      res.status(201).json(newService);
    } else {
      res
        .status(400)
        .json({ error: "Datos de servicio incompletos o inválidos" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error al agregar el servicio" });
  }
});

router.put("/:id", async (req, res) => {
  const serviceData = req.body;
  const serviceId = req.params.id;

  try {
    const newService = await serviceManager.updateService(
      serviceId,
      serviceData,
    );
    if (newService) {
      res.status(200).json(newService);
    } else {
      res.status(404).json({ error: "No se encontró el servicio" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar el servicio" });
  }
});

router.delete("/:id", async (req, res) => {
  const serviceId = req.params.id;

  try {
    const deletedService = await serviceManager.deleteService(serviceId);
    if (deletedService) {
      res.status(200).json(deletedService);
    } else {
      res.status(404).json({ error: "No se encontró el servicio" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar el servicio" });
  }
});

export default router;
