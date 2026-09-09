import * as servicesService from "../services/services.service.js";
import * as bookingsService from "../services/bookings.service.js";
import * as messagesService from "../services/messages.service.js";

//las vistas usan las mismas capas que la API: no consultan la base por su cuenta

const formatearMomento = (fecha) =>
  fecha ? new Date(fecha).toLocaleString("es-AR") : "";

const formatearFecha = (fecha) =>
  fecha ? new Date(fecha).toLocaleDateString("es-AR") : "sin fecha";

export const renderServices = async (req, res) => {
  try {
    const services = await servicesService.getServices(req.query);
    res.render("services", {
      title: "Servicios",
      services: services.map((s) => s.toObject()),
    });
  } catch (error) {
    res.status(500).render("services", {
      title: "Servicios",
      services: [],
      error: "No se pudieron cargar los servicios",
    });
  }
};

export const renderAvailability = async (req, res) => {
  try {
    const [bookings, services] = await Promise.all([
      bookingsService.getBookingsWithServices(),
      servicesService.getServices(),
    ]);

    res.render("availability", {
      title: "Disponibilidad",
      bookings: bookings.map((b) => ({
        ...b.toObject(),
        fecha: formatearFecha(b.date),
      })),
      total: services.length,
      disponibles: services.filter((s) => s.available).length,
    });
  } catch (error) {
    res.status(500).render("availability", {
      title: "Disponibilidad",
      bookings: [],
      total: 0,
      disponibles: 0,
      error: "No se pudo cargar la disponibilidad",
    });
  }
};

export const renderActivity = async (req, res) => {
  try {
    const messages = await messagesService.getLatestMessages();
    res.render("activity", {
      title: "Actividad",
      messages: messages.map((m) => ({
        ...m.toObject(),
        momento: formatearMomento(m.createdAt),
      })),
    });
  } catch (error) {
    res.status(500).render("activity", {
      title: "Actividad",
      messages: [],
      error: "No se pudo cargar la actividad",
    });
  }
};
