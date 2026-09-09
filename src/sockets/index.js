import * as messagesService from "../services/messages.service.js";

//los handlers de socket viven aca para que server.js solo se ocupe de levantar el servidor
export const registrarSockets = (io) => {
  io.on("connection", (socket) => {
    console.log(`Cliente conectado: ${socket.id}`);

    //el cliente manda una nota desde el panel de actividad
    socket.on("nuevaNota", async ({ user, message }) => {
      const nota = await messagesService.createMessage({ user, message });

      if (!nota) {
        //el dato no paso la validacion: se le avisa solo a quien la envio
        socket.emit("notaRechazada", {
          error: "El usuario y el mensaje son obligatorios",
        });
        return;
      }

      //se avisa a todos los paneles abiertos, incluido el que la envio
      io.emit("actividadRegistrada", nota);
    });

    socket.on("disconnect", () => {
      console.log(`Cliente desconectado: ${socket.id}`);
    });
  });
};

//registra una novedad del sistema y la difunde a los paneles abiertos
export const registrarActividad = async (io, user, message) => {
  const nota = await messagesService.createMessage({ user, message });
  if (nota) {
    io?.emit("actividadRegistrada", nota);
  }
  return nota;
};
