import express from "express";
import servicesRouter from "./routes/services.router.js";
import bookingsRouter from "./routes/bookings.router.js";
import messagesRouter from "./routes/messages.router.js";

const app = express();
app.use(express.json());
app.use("/api/services", servicesRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/messages", messagesRouter);

export default app;
