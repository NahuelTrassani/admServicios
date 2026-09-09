import messagesRepository from "../repositories/messages.repository.js";
import { esErrorDeValidacion } from "../utils/errors.js";

export const getMessages = async () => {
  return messagesRepository.getAll();
};

//las novedades se muestran de la mas reciente a la mas vieja
export const getLatestMessages = async (limite = 20) => {
  const messages = await messagesRepository.getAll();
  return messages.slice(-limite).reverse();
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
