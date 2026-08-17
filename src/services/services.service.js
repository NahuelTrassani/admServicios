import servicesRepository from "../repositories/services.repository.js";

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
  //validaciones de negocio
  if (
    !data ||
    !data.name ||
    !data.description ||
    data.duration === undefined ||
    data.price === undefined ||
    !data.category ||
    data.available === undefined
  ) {
    return null;
  }

  return servicesRepository.create(data);
};

export const updateService = async (id, data) => {
  return servicesRepository.update(id, data);
};

export const deleteService = async (id) => {
  return servicesRepository.update(id, { available: false });
};
