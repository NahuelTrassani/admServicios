import { createServer } from "http";
import { Server } from "socket.io";
import app from "./app.js";
import config from "./config/env.config.js";
import { connectDB } from "./config/db.config.js";

await connectDB();

//socket.io necesita el servidor http, no alcanza con la app de express
const httpServer = createServer(app);
const io = new Server(httpServer);

//se guarda en la app para que los controllers puedan emitir con req.app.get("io"),
//sin importar socket.io desde las capas internas
app.set("io", io);

io.on("connection", (socket) => {
  console.log(`Cliente conectado: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`Cliente desconectado: ${socket.id}`);
  });
});

httpServer.listen(config.port, () => {
  console.log(
    `App ejecutando en modo ${config.nodeEnv} - puerto ${config.port}`,
  );
});
