import * as servicesService from "../services/services.service.js";
import * as bookingsService from "../services/bookings.service.js";
import * as messagesService from "../services/messages.service.js";
import { listServicesQuerySchema } from "../validations/service.validation.js";

//las vistas usan las mismas capas que la API: no consultan la base por su cuenta

const formatearMomento = (fecha) =>
  fecha ? new Date(fecha).toLocaleString("es-AR") : "";

//la fecha del turno es un dia de calendario guardado a medianoche UTC: se muestra en UTC
//para que en Argentina (UTC-3) no aparezca como el dia anterior
const formatearFecha = (fecha) =>
  fecha ? new Date(fecha).toLocaleDateString("es-AR", { timeZone: "UTC" }) : "sin fecha";

export const renderServices = async (req, res) => {
  try {
    //la vista usa la misma consulta paginada que la API, con un limite mas alto
    const criterios = listServicesQuerySchema.parse({ limit: "50", ...req.query });
    const resultado = await servicesService.searchServices(criterios);

    res.render("services", {
      title: "Servicios",
      services: resultado.services.map((s) => s.toObject()),
      paginacion: {
        total: resultado.total,
        limit: resultado.limit,
        page: resultado.page,
        totalPages: resultado.totalPages,
        hasPrevPage: resultado.hasPrevPage,
        hasNextPage: resultado.hasNextPage,
        prevPage: resultado.prevPage,
        nextPage: resultado.nextPage,
      },
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
    const [bookings, total, disponibles] = await Promise.all([
      bookingsService.getBookingsWithServices(),
      servicesService.countServices(),
      servicesService.countServices({ available: true }),
    ]);

    res.render("availability", {
      title: "Disponibilidad",
      bookings: bookings.map((b) => ({
        ...b.toObject(),
        fecha: formatearFecha(b.date),
      })),
      total,
      disponibles,
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
