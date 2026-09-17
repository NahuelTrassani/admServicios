import mongoose from "mongoose";

//solo estas reservas ocupan un turno: una cancelada libera el horario
export const ESTADOS_ACTIVOS = ["pendiente", "confirmada"];

const bookingSchema = new mongoose.Schema({
  clientName: { type: String, required: true, trim: true },
  clientEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    //acepta texto@texto.dominio, sin espacios ni arrobas de mas
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "El email no tiene un formato válido"],
  },
  date: { type: Date, required: true },
  time: {
    type: String,
    required: true,
    //formato HH:MM en 24 horas
    match: [/^([01]\d|2[0-3]):[0-5]\d$/, "La hora debe tener formato HH:MM"],
  },
  status: {
    type: String,
    required: true,
    enum: {
      values: ["pendiente", "confirmada", "cancelada"],
      message: "El estado debe ser pendiente, confirmada o cancelada",
    },
    default: "pendiente",
  },
  services: [
    {
      service: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
      quantity: { type: Number, default: 1, min: 1 },
      _id: false,
    },
  ],
});

//un turno es fecha + hora: dos reservas activas no pueden compartirlo.
//el indice lo hace cumplir la base, aunque lleguen dos pedidos al mismo tiempo
bookingSchema.index(
  { date: 1, time: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ESTADOS_ACTIVOS } },
  },
);

export default mongoose.model("Booking", bookingSchema);
