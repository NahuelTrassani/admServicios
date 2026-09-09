import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { engine } from "express-handlebars";
import servicesRouter from "./routes/services.router.js";
import bookingsRouter from "./routes/bookings.router.js";
import messagesRouter from "./routes/messages.router.js";
import viewsRouter from "./routes/views.router.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(express.json());
//las vistas mandan datos por formulario, no como json
app.use(express.urlencoded({ extended: true }));

//handlebars como motor de plantillas
app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "views"));

//css e imagenes del lado del cliente
app.use(express.static(path.join(__dirname, "../public")));

//API REST
app.use("/api/services", servicesRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/messages", messagesRouter);

//vistas renderizadas en el servidor
app.use("/views", viewsRouter);

export default app;
