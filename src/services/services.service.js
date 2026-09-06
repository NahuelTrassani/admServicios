import servicesRepository from "../repositories/services.repository.js";
import { esErrorDeValidacion } from "../utils/errors.js";

export const getServices = async (filters = {}) => {
  const services = await servicesRepository.getAll();
  let result = services;

  //filtrar es una regla de negocio, no trabajo del controller
  if (filters.category) {
    result = result.filter((s) => s.category === filters.category);
  }
  if (filters.available) {
    result = result.filter(
      (s) => s.available === (filters.available === "true"),
    );
  }

  return result;
};

export const getServiceById = async (id) => {
  return servicesRepository.getById(id);
};

export const createService = async (data) => {
  if (!data) {
    return null;
  }

  try {
    return await servicesRepository.create(data);
  } catch (error) {
    //el schema rechazo el dato: es culpa del cliente, no del servidor
    if (esErrorDeValidacion(error)) {
      return null;
    }
    throw error;
  }
};

export const updateService = async (id, data) => {
  try {
    return await servicesRepository.update(id, data);
  } catch (error) {
    if (esErrorDeValidacion(error)) {
      return null;
    }
    throw error;
  }
};

export const deleteService = async (id) => {
  //dar de baja es marcar como no disponible, no borrar el documento
  return servicesRepository.update(id, { available: false });
};
