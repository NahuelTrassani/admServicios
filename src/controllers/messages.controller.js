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

export const updateMessage = async (req, res) => {
  const messageId = req.params.mid;
  const messageData = req.body;
  try {
    const updated = await messagesService.updateMessage(messageId, messageData);
    if (updated) {
      req.app.get("io")?.emit("actividadEditada", updated);
      res.status(200).json(updated);
    } else {
      res.status(404).json({ error: "Mensaje no encontrado" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar el mensaje" });
  }
};

export const deleteMessage = async (req, res) => {
  const messageId = req.params.mid;
  try {
    const deleted = await messagesService.deleteMessage(messageId);
    if (deleted) {
      req.app.get("io")?.emit("actividadEliminada", deleted);
      res.status(200).json(deleted);
    } else {
      res.status(404).json({ error: "Mensaje no encontrado" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar el mensaje" });
  }
};
