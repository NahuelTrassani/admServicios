import * as messagesService from "../services/messages.service.js";

export const getMessages = async (req, res) => {
  try {
    const messages = await messagesService.getMessages();
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los mensajes" });
  }
};

export const getMessageById = async (req, res) => {
  const messageId = req.params.mid;
  try {
    const message = await messagesService.getMessageById(messageId);
    if (message) {
      res.status(200).json(message);
    } else {
      res.status(404).json({ error: "Mensaje no encontrado" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el mensaje" });
  }
};

export const createMessage = async (req, res) => {
  const messageData = req.body;
  try {
    const newMessage = await messagesService.createMessage(messageData);
    if (newMessage) {
      res.status(201).json(newMessage);
    } else {
      res.status(400).json({ error: "Datos de mensaje incompletos o inválidos" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error al crear el mensaje" });
  }
};
