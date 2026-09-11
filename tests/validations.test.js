import { describe, it, expect } from "vitest";
import {
  createServiceSchema,
  updateServiceSchema,
  listServicesQuerySchema,
  serviceIdParamSchema,
} from "../src/validations/service.validation.js";
import {
  createBookingSchema,
  addServiceParamsSchema,
  bookingIdParamSchema,
} from "../src/validations/booking.validation.js";
import {
  createMessageSchema,
  updateMessageSchema,
  messageIdParamSchema,
} from "../src/validations/message.validation.js";

const servicioValido = {
  name: "Mecánica",
  description: "Servicio de mecanica general",
  duration: 30,
  price: 9500,
  category: "mecanica",
  available: true,
};

//cada schema se prueba contra el dato correcto y contra el dato que tiene que rechazar
const campoQueFallo = (resultado) => resultado.error.issues[0].path.join(".");

describe("createServiceSchema", () => {
  it("acepta un servicio completo", () => {
    expect(createServiceSchema.safeParse(servicioValido).success).toBe(true);
  });

  it("acepta precio cero: gratis es un precio valido", () => {
    const r = createServiceSchema.safeParse({ ...servicioValido, price: 0 });
    expect(r.success).toBe(true);
  });

  it("rechaza precio negativo", () => {
    const r = createServiceSchema.safeParse({ ...servicioValido, price: -1 });
    expect(r.success).toBe(false);
    expect(campoQueFallo(r)).toBe("price");
  });

  it("rechaza duracion cero o fraccionada", () => {
    expect(createServiceSchema.safeParse({ ...servicioValido, duration: 0 }).success).toBe(false);
    expect(createServiceSchema.safeParse({ ...servicioValido, duration: 1.5 }).success).toBe(false);
  });

  it("rechaza el nombre vacio y el que es solo espacios", () => {
    expect(createServiceSchema.safeParse({ ...servicioValido, name: "" }).success).toBe(false);
    expect(createServiceSchema.safeParse({ ...servicioValido, name: "   " }).success).toBe(false);
  });

  it("recorta los espacios de los strings", () => {
    const r = createServiceSchema.safeParse({ ...servicioValido, name: "  Mecánica  " });
    expect(r.data.name).toBe("Mecánica");
  });

  it("rechaza cuando falta un campo obligatorio", () => {
    const { price, ...sinPrecio } = servicioValido;
    const r = createServiceSchema.safeParse(sinPrecio);
    expect(r.success).toBe(false);
    expect(campoQueFallo(r)).toBe("price");
  });

  it("rechaza el numero mandado como string: no convierte tipos en el body", () => {
    const r = createServiceSchema.safeParse({ ...servicioValido, price: "9500" });
    expect(r.success).toBe(false);
  });

  it("rechaza campos de mas, por strict", () => {
    const r = createServiceSchema.safeParse({ ...servicioValido, _id: "abc" });
    expect(r.success).toBe(false);
  });

  it("rechaza el nombre mas largo que el maximo", () => {
    const r = createServiceSchema.safeParse({ ...servicioValido, name: "a".repeat(81) });
    expect(r.success).toBe(false);
  });
});

describe("updateServiceSchema", () => {
  it("acepta un solo campo", () => {
    expect(updateServiceSchema.safeParse({ price: 100 }).success).toBe(true);
  });

  it("rechaza el body vacio: un PUT sin cambios no tiene sentido", () => {
    expect(updateServiceSchema.safeParse({}).success).toBe(false);
  });

  it("sigue validando el campo que si viene", () => {
    expect(updateServiceSchema.safeParse({ name: "" }).success).toBe(false);
    expect(updateServiceSchema.safeParse({ price: -5 }).success).toBe(false);
  });

  it("sigue rechazando campos desconocidos", () => {
    expect(updateServiceSchema.safeParse({ inventado: 1 }).success).toBe(false);
  });
});

describe("listServicesQuerySchema", () => {
  it("sin query aplica todos los defaults", () => {
    const r = listServicesQuerySchema.safeParse({});
    expect(r.success).toBe(true);
    expect(r.data).toEqual({ page: 1, limit: 10, sortBy: "name", order: "asc" });
  });

  it("convierte page y limit de string a numero", () => {
    const r = listServicesQuerySchema.safeParse({ page: "3", limit: "25" });
    expect(r.data.page).toBe(3);
    expect(r.data.limit).toBe(25);
  });

  it("rechaza page cero o negativa", () => {
    expect(listServicesQuerySchema.safeParse({ page: "0" }).success).toBe(false);
    expect(listServicesQuerySchema.safeParse({ page: "-1" }).success).toBe(false);
  });

  it("rechaza page que no es numero", () => {
    expect(listServicesQuerySchema.safeParse({ page: "abc" }).success).toBe(false);
  });

  it("frena el limit exagerado, que es lo que tumba la base", () => {
    expect(listServicesQuerySchema.safeParse({ limit: "100" }).success).toBe(true);
    expect(listServicesQuerySchema.safeParse({ limit: "101" }).success).toBe(false);
  });

  it("solo deja ordenar por campos conocidos", () => {
    expect(listServicesQuerySchema.safeParse({ sortBy: "price" }).success).toBe(true);
    expect(listServicesQuerySchema.safeParse({ sortBy: "password" }).success).toBe(false);
  });

  it("solo acepta asc o desc", () => {
    expect(listServicesQuerySchema.safeParse({ order: "desc" }).success).toBe(true);
    expect(listServicesQuerySchema.safeParse({ order: "arriba" }).success).toBe(false);
  });

  it("available viaja como string porque en la url todo es texto", () => {
    expect(listServicesQuerySchema.safeParse({ available: "true" }).success).toBe(true);
    expect(listServicesQuerySchema.safeParse({ available: "si" }).success).toBe(false);
  });

  it("rechaza un parametro que no esta contemplado", () => {
    expect(listServicesQuerySchema.safeParse({ orden: "asc" }).success).toBe(false);
  });
});

describe("createBookingSchema", () => {
  const reservaValida = {
    clientName: "Juan Perez",
    clientEmail: "juan@mail.com",
    date: "2026-09-15",
    time: "14:30",
  };

  it("acepta una reserva valida y pone el estado por defecto", () => {
    const r = createBookingSchema.safeParse(reservaValida);
    expect(r.success).toBe(true);
    expect(r.data.status).toBe("pendiente");
  });

  it("rechaza un email sin arroba o sin dominio", () => {
    expect(createBookingSchema.safeParse({ ...reservaValida, clientEmail: "juan" }).success).toBe(false);
    expect(createBookingSchema.safeParse({ ...reservaValida, clientEmail: "juan@mail" }).success).toBe(false);
  });

  it("rechaza la fecha en otro formato", () => {
    expect(createBookingSchema.safeParse({ ...reservaValida, date: "15/09/2026" }).success).toBe(false);
  });

  it("rechaza una fecha que no existe en el calendario", () => {
    //el 31 de febrero pasa el formato pero no es un dia real
    expect(createBookingSchema.safeParse({ ...reservaValida, date: "2026-02-31" }).success).toBe(false);
    expect(createBookingSchema.safeParse({ ...reservaValida, date: "2026-13-01" }).success).toBe(false);
  });

  it("acepta el 29 de febrero de un año bisiesto", () => {
    expect(createBookingSchema.safeParse({ ...reservaValida, date: "2028-02-29" }).success).toBe(true);
    expect(createBookingSchema.safeParse({ ...reservaValida, date: "2026-02-29" }).success).toBe(false);
  });

  it("rechaza horas fuera del reloj de 24", () => {
    expect(createBookingSchema.safeParse({ ...reservaValida, time: "25:00" }).success).toBe(false);
    expect(createBookingSchema.safeParse({ ...reservaValida, time: "14:60" }).success).toBe(false);
    expect(createBookingSchema.safeParse({ ...reservaValida, time: "9:30" }).success).toBe(false);
  });

  it("solo acepta los tres estados del negocio", () => {
    expect(createBookingSchema.safeParse({ ...reservaValida, status: "confirmada" }).success).toBe(true);
    expect(createBookingSchema.safeParse({ ...reservaValida, status: "lista" }).success).toBe(false);
  });

  it("no deja mandar los servicios en la creacion: van por su propio endpoint", () => {
    const r = createBookingSchema.safeParse({ ...reservaValida, services: [] });
    expect(r.success).toBe(false);
  });
});

describe("schemas de params", () => {
  const id = "64b7f3c2a1d4e5f6a7b8c9d0";

  it("los tres recursos validan el id con la misma regla", () => {
    expect(serviceIdParamSchema.safeParse({ id }).success).toBe(true);
    expect(messageIdParamSchema.safeParse({ mid: id }).success).toBe(true);
    expect(serviceIdParamSchema.safeParse({ id: "abc" }).success).toBe(false);
    expect(messageIdParamSchema.safeParse({ mid: "abc" }).success).toBe(false);
  });

  it("acepta un ObjectId bien formado", () => {
    expect(bookingIdParamSchema.safeParse({ bid: id }).success).toBe(true);
    expect(addServiceParamsSchema.safeParse({ bid: id, sid: id }).success).toBe(true);
  });

  it("rechaza un id corto o con caracteres no hexadecimales", () => {
    expect(bookingIdParamSchema.safeParse({ bid: "123" }).success).toBe(false);
    expect(bookingIdParamSchema.safeParse({ bid: "z".repeat(24) }).success).toBe(false);
  });

  it("marca cual de los dos identificadores esta mal", () => {
    const r = addServiceParamsSchema.safeParse({ bid: id, sid: "roto" });
    expect(r.success).toBe(false);
    expect(campoQueFallo(r)).toBe("sid");
  });
});

describe("schemas de mensajes", () => {
  it("acepta un mensaje valido", () => {
    expect(createMessageSchema.safeParse({ user: "nahuel", message: "hola" }).success).toBe(true);
  });

  it("rechaza el mensaje vacio", () => {
    expect(createMessageSchema.safeParse({ user: "nahuel", message: "" }).success).toBe(false);
  });

  it("corta el mensaje que supera el maximo", () => {
    const r = createMessageSchema.safeParse({ user: "nahuel", message: "a".repeat(501) });
    expect(r.success).toBe(false);
  });

  it("el update acepta parcial pero no vacio", () => {
    expect(updateMessageSchema.safeParse({ message: "editado" }).success).toBe(true);
    expect(updateMessageSchema.safeParse({}).success).toBe(false);
  });
});
