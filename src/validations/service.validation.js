import { z } from "zod";
import { objectId } from "./objectId.js";

const CATEGORIA_MAX = 40;
const NOMBRE_MAX = 80;
const DESCRIPCION_MAX = 300;

export const createServiceSchema = z
  .object({
    name: z
      .string({ error: "El nombre es obligatorio" })
      .trim()
      .min(1, "El nombre no puede estar vacío")
      .max(NOMBRE_MAX, `El nombre no puede superar los ${NOMBRE_MAX} caracteres`),
    description: z
      .string({ error: "La descripción es obligatoria" })
      .trim()
      .min(1, "La descripción no puede estar vacía")
      .max(DESCRIPCION_MAX, `La descripción no puede superar los ${DESCRIPCION_MAX} caracteres`),
    duration: z
      .number({ error: "La duración es obligatoria y debe ser un número" })
      .int("La duración debe ser un número entero de minutos")
      .min(1, "La duración debe ser de al menos 1 minuto"),
    price: z
      .number({ error: "El precio es obligatorio y debe ser un número" })
      .min(0, "El precio no puede ser negativo"),
    category: z
      .string({ error: "La categoría es obligatoria" })
      .trim()
      .min(1, "La categoría no puede estar vacía")
      .max(CATEGORIA_MAX, `La categoría no puede superar los ${CATEGORIA_MAX} caracteres`),
    available: z.boolean({ error: "La disponibilidad es obligatoria (true o false)" }),
  })
  //rechaza campos que no pertenecen al recurso, incluido un _id enviado a mano
  .strict();

//en el update todos los campos son opcionales, pero al menos uno tiene que venir
export const updateServiceSchema = createServiceSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    error: "Hay que enviar al menos un campo para actualizar",
  });

//los query params llegan siempre como texto: coerce los convierte antes de validar
export const listServicesQuerySchema = z
  .object({
    category: z.string().trim().min(1).optional(),
    available: z.enum(["true", "false"], {
      error: "El filtro available solo acepta true o false",
    }).optional(),
    page: z.coerce
      .number({ error: "La página debe ser un número" })
      .int("La página debe ser un número entero")
      .min(1, "La página debe ser mayor o igual a 1")
      .default(1),
    limit: z.coerce
      .number({ error: "El límite debe ser un número" })
      .int("El límite debe ser un número entero")
      .min(1, "El límite debe ser mayor o igual a 1")
      .max(100, "El límite no puede superar los 100 resultados por página")
      .default(10),
    //lista cerrada: evita ordenar por un campo arbitrario enviado desde afuera
    sortBy: z
      .enum(["name", "price", "duration", "category", "createdAt"], {
        error: "Solo se puede ordenar por name, price, duration, category o createdAt",
      })
      .default("name"),
    order: z
      .enum(["asc", "desc"], { error: "El orden solo acepta asc o desc" })
      .default("asc"),
  })
  .strict();

//el id viaja en la url: se valida el formato antes de ir a la base
export const serviceIdParamSchema = z
  .object({ id: objectId("identificador del servicio") })
  .strict();
