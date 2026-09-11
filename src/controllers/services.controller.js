import * as servicesService from "../services/services.service.js";
import { registrarActividad } from "../sockets/index.js";

export const getServices = async (req, res) => {
  try {
    //req.consulta viene del middleware con los tipos convertidos y los defaults puestos
    const resultado = await servicesService.searchServices(req.consulta);
    res.status(200).json(resultado);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los servicios" });
  }
};

export const getServiceById = async (req, res) => {
  const serviceId = req.params.id;
  try {
    const service = await servicesService.getServiceById(serviceId);
    if (service) {
      res.status(200).json(service);
    } else {
      res.status(404).json({ error: "Servicio no encontrado" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el servicio" });
  }
};

export const createService = async (req, res) => {
  const serviceData = req.body;
  try {
    const newService = await servicesService.createService(serviceData);
    if (newService) {
      const io = req.app.get("io");
      //avisa a las vistas abiertas para que agreguen la fila sin recargar
      io?.emit("servicioCreado", newService);
      registrarActividad(io, "sistema", `Se creo el servicio ${newService.name}`);
      res.status(201).json(newService);
    } else {
      res
        .status(400)
        .json({ error: "Datos de servicio incompletos o inválidos" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error al agregar el servicio" });
  }
};

export const updateService = async (req, res) => {
  const serviceData = req.body;
  const serviceId = req.params.id;
  try {
    const newService = await servicesService.updateService(
      serviceId,
      serviceData,
    );
    if (newService) {
      req.app.get("io")?.emit("servicioActualizado", newService);
      res.status(200).json(newService);
    } else {
      res.status(404).json({ error: "No se encontró el servicio" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar el servicio" });
  }
};

export const deleteService = async (req, res) => {
  const serviceId = req.params.id;
  try {
    const deletedService = await servicesService.deleteService(serviceId);
    if (deletedService) {
      const io = req.app.get("io");
      io?.emit("servicioActualizado", deletedService);
      registrarActividad(io, "sistema", `Se dio de baja el servicio ${deletedService.name}`);
      res.status(200).json(deletedService);
    } else {
      res.status(404).json({ error: "No se encontró el servicio" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar el servicio" });
  }
};
