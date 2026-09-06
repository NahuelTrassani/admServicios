//mongoose marca asi los errores del schema: campos faltantes, tipos, enum, min/max.
//sirven para distinguir un dato mal enviado por el cliente (400) de una falla real (500)
export const esErrorDeValidacion = (error) =>
  error?.name === "ValidationError" || error?.name === "CastError";
