import servicesRepository from "../repositories/services.repository.js";
import { esErrorDeValidacion } from "../utils/errors.js";

//contar lo resuelve mongo con countDocuments: no se traen documentos para medir
export const countServices = async (filtro = {}) => servicesRepository.count(filtro);

//consulta paginada: mongo filtra, ordena y corta; aca se arman los metadatos
export const searchServices = async (criterios) => {
  const { items, total } = await servicesRepository.search(criterios);
  const { page, limit } = criterios;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    services: items,
    total,
    page,
    limit,
    totalPages,
    hasPrevPage: page > 1,
    hasNextPage: page < totalPages,
    prevPage: page > 1 ? page - 1 : null,
    nextPage: page < totalPages ? page + 1 : null,
  };
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
