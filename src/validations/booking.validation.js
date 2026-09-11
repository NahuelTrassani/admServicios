import { z } from "zod";
import { objectId } from "./objectId.js";

export const createBookingSchema = z
  .object({
    clientName: z
      .string({ error: "El nombre del cliente es obligatorio" })
      .trim()
      .min(1, "El nombre del cliente no puede estar vacío")
      .max(80, "El nombre del cliente no puede superar los 80 caracteres"),
    clientEmail: z
      .string({ error: "El email es obligatorio" })
      .trim()
      .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "El email no tiene un formato válido"),
    date: z
      .string({ error: "La fecha es obligatoria" })
      .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener formato AAAA-MM-DD")
      //Date.parse("2026-02-31") no falla: javascript la corre al 3 de marzo.
      //la unica forma de detectarlo es comparar contra lo que se escribio
      .refine(
        (valor) => {
          const [anio, mes, dia] = valor.split("-").map(Number);
          const fecha = new Date(Date.UTC(anio, mes - 1, dia));
          return (
            fecha.getUTCFullYear() === anio &&
            fecha.getUTCMonth() === mes - 1 &&
            fecha.getUTCDate() === dia
          );
        },
        { error: "La fecha no existe en el calendario" },
      ),
    time: z
      .string({ error: "La hora es obligatoria" })
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "La hora debe tener formato HH:MM en 24 horas"),
    status: z
      .enum(["pendiente", "confirmada", "cancelada"], {
        error: "El estado debe ser pendiente, confirmada o cancelada",
      })
      .default("pendiente"),
  })
  //una reserva nace sin servicios: se agregan con su propio endpoint
  .strict();

//los dos identificadores viajan en la url, no en el body
export const addServiceParamsSchema = z
  .object({
    bid: objectId("identificador de la reserva"),
    sid: objectId("identificador del servicio"),
  })
  .strict();

export const bookingIdParamSchema = z
  .object({ bid: objectId("identificador de la reserva") })
  .strict();
