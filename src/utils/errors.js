//mongoose marca asi los errores del schema: campos faltantes, tipos, enum, min/max.
//sirven para distinguir un dato mal enviado por el cliente (400) de una falla real (500)
export const esErrorDeValidacion = (error) =>
  error?.name === "ValidationError" || error?.name === "CastError";

//codigo que devuelve mongo cuando una escritura viola un indice unico
export const esClaveDuplicada = (error) => error?.code === 11000;

//el dato es valido pero el turno ya lo tomo otra reserva: el controller lo traduce a 409
export class TurnoOcupadoError extends Error {
  constructor(date, time) {
    super("El turno seleccionado ya no está disponible");
    this.name = "TurnoOcupadoError";
    this.turno = { date, time };
  }
}
