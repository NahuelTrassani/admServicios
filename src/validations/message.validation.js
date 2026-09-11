import { z } from "zod";
import { objectId } from "./objectId.js";

export const createMessageSchema = z
  .object({
    user: z
      .string({ error: "El usuario es obligatorio" })
      .trim()
      .min(1, "El usuario no puede estar vacío")
      .max(40, "El usuario no puede superar los 40 caracteres"),
    message: z
      .string({ error: "El mensaje es obligatorio" })
      .trim()
      .min(1, "El mensaje no puede estar vacío")
      .max(500, "El mensaje no puede superar los 500 caracteres"),
  })
  .strict();

export const updateMessageSchema = createMessageSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    error: "Hay que enviar al menos un campo para actualizar",
  });

//el id viaja en la url: se valida el formato antes de ir a la base
export const messageIdParamSchema = z
  .object({ mid: objectId("identificador del mensaje") })
  .strict();
