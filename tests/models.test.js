import { describe, it, expect } from "vitest";
import Service from "../src/models/service.model.js";
import Booking from "../src/models/booking.model.js";
import Message from "../src/models/message.model.js";

//validate() corre las validaciones del schema sin conectarse a la base:
//resuelve si el documento es valido, rechaza con los errores si no lo es

const esValido = (doc) => expect(doc.validate()).resolves.toBeUndefined();

const falla = (doc, campo) =>
  expect(doc.validate()).rejects.toMatchObject({
    errors: { [campo]: expect.anything() },
  });

describe("Service model", () => {
  const valido = {
    name: "Mecánica",
    description: "Servicio de mecanica general",
    duration: 30,
    price: 9500,
    category: "mecanica",
    available: true,
  };

  it("acepta un servicio con todos los campos", () => esValido(new Service(valido)));

  it("rechaza si falta un campo obligatorio", () => {
    const { price, ...sinPrecio } = valido;
    return falla(new Service(sinPrecio), "price");
  });

  it("acepta price 0", () => esValido(new Service({ ...valido, price: 0 })));

  it("rechaza price negativo", () =>
    falla(new Service({ ...valido, price: -1 }), "price"));

  it("rechaza duration menor a 1", () =>
    falla(new Service({ ...valido, duration: 0 }), "duration"));

  it("normaliza la categoria a minusculas", () => {
    expect(new Service({ ...valido, category: "MECANICA" }).category).toBe("mecanica");
  });
});

describe("Booking model", () => {
  const valido = {
    clientName: "Juan",
    clientEmail: "juan@mail.com",
    date: "2026-09-15",
    time: "10:30",
    status: "pendiente",
  };

  it("acepta una reserva valida", () => esValido(new Booking(valido)));

  it("acepta los tres estados permitidos", () =>
    Promise.all(
      ["pendiente", "confirmada", "cancelada"].map((status) =>
        esValido(new Booking({ ...valido, status })),
      ),
    ));

  it("rechaza un estado fuera del enum", () =>
    falla(new Booking({ ...valido, status: "banana" }), "status"));

  it("rechaza un email sin arroba", () =>
    falla(new Booking({ ...valido, clientEmail: "juanmail.com" }), "clientEmail"));

  it("rechaza un email sin dominio", () =>
    falla(new Booking({ ...valido, clientEmail: "juan@mail" }), "clientEmail"));

  it("rechaza una hora invalida", () =>
    falla(new Booking({ ...valido, time: "25:00" }), "time"));

  it("normaliza el email a minusculas", () => {
    expect(new Booking({ ...valido, clientEmail: "JUAN@MAIL.COM" }).clientEmail).toBe(
      "juan@mail.com",
    );
  });

  it("nace con services vacio", () => {
    expect(new Booking(valido).services).toHaveLength(0);
  });

  it("guarda en services solo la referencia y la cantidad", () => {
    const booking = new Booking({
      ...valido,
      services: [{ service: "68b1f2a4c9e77d3b1a4f0012", quantity: 2 }],
    });
    const item = booking.services[0].toObject();
    expect(Object.keys(item).sort()).toEqual(["quantity", "service"]);
  });

  it("rechaza quantity menor a 1", () =>
    expect(
      new Booking({
        ...valido,
        services: [{ service: "68b1f2a4c9e77d3b1a4f0012", quantity: 0 }],
      }).validate(),
    ).rejects.toThrow());
});

describe("Message model", () => {
  const valido = { user: "juan@mail.com", message: "hola" };

  it("acepta un mensaje valido", () => esValido(new Message(valido)));

  it("rechaza si falta el usuario", () =>
    falla(new Message({ message: "hola" }), "user"));

  it("rechaza un mensaje mas largo que el maximo", () =>
    falla(new Message({ ...valido, message: "a".repeat(501) }), "message"));
});

describe("indice del turno", () => {
  //el indice se declara en el schema para que viaje con el codigo y mongoose lo cree al levantar
  const indiceDelTurno = () =>
    Booking.schema.indexes().find(([campos]) => campos.date === 1 && campos.time === 1);

  it("fecha y hora forman un indice unico", () => {
    const [, opciones] = indiceDelTurno();
    expect(opciones.unique).toBe(true);
  });

  it("solo cuentan las reservas activas: una cancelada libera el horario", () => {
    const [, opciones] = indiceDelTurno();
    expect(opciones.partialFilterExpression).toEqual({
      status: { $in: ["pendiente", "confirmada"] },
    });
  });
});
