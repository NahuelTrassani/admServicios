import messagesRepository from "../repositories/messages.repository.js";
import { esErrorDeValidacion } from "../utils/errors.js";

export const getMessages = async () => {
  return messagesRepository.getAll();
};

//las novedades se muestran de la mas reciente a la mas vieja
export const getLatestMessages = async (limite = 20) => {
  return messagesRepository.getLatest(limite);
};

export const getMessageById = async (id) => {
  return messagesRepository.getById(id);
};

export const createMessage = async (data) => {
  if (!data) {
    return null;
  }

  try {
    return await messagesRepository.create(data);
  } catch (error) {
    //el schema rechazo el dato: es culpa del cliente, no del servidor
    if (esErrorDeValidacion(error)) {
      return null;
    }
    throw error;
  }
};

export const updateMessage = async (id, data) => {
  if (!data) {
    return null;
  }

  try {
    return await messagesRepository.update(id, data);
  } catch (error) {
    //el schema rechazo el dato: es culpa del cliente, no del servidor
    if (esErrorDeValidacion(error)) {
      return null;
    }
    throw error;
  }
};

//a diferencia de los servicios, un mensaje no lo referencia ningun documento:
//no hace falta baja logica, el borrado es fisico
export const deleteMessage = async (id) => {
  return messagesRepository.delete(id);
};
