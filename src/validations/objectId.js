import { z } from "zod";

//un ObjectId de mongo son 24 caracteres hexadecimales
export const objectId = (campo) =>
  z
    .string({ error: `El ${campo} es obligatorio` })
    .regex(
      /^[0-9a-fA-F]{24}$/,
      `El ${campo} no tiene el formato de un identificador válido`,
    );
