import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../src/middlewares/validate.js";

const esquema = z
  .object({
    nombre: z.string({ error: "El nombre es obligatorio" }).min(1, "vacio no"),
    edad: z.coerce.number().int().min(0).default(0),
  })
  .strict();

const armarRes = () => {
  const res = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  return res;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("validateBody", () => {
  it("deja pasar al controller cuando el dato es valido", () => {
    const req = { body: { nombre: "Juan", edad: 30 } };
    const res = armarRes();
    const next = vi.fn();

    validateBody(esquema)(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("pisa req.body con el dato ya convertido, asi el controller no reconvierte", () => {
    const req = { body: { nombre: "Juan", edad: "30" } };
    const next = vi.fn();

    validateBody(esquema)(req, armarRes(), next);

    expect(req.body.edad).toBe(30);
  });

  it("aplica los defaults del schema", () => {
    const req = { body: { nombre: "Juan" } };
    validateBody(esquema)(req, armarRes(), vi.fn());
    expect(req.body.edad).toBe(0);
  });

  it("corta la cadena con 400 y no llama al controller", () => {
    const req = { body: { edad: 30 } };
    const res = armarRes();
    const next = vi.fn();

    validateBody(esquema)(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("devuelve el campo y el mensaje de cada error, no un texto suelto", () => {
    const req = { body: { nombre: "" } };
    const res = armarRes();

    validateBody(esquema)(req, res, vi.fn());

    const cuerpo = res.json.mock.calls[0][0];
    expect(cuerpo.error).toBe("Datos inválidos");
    expect(cuerpo.detalles[0]).toEqual({ campo: "nombre", mensaje: "vacio no" });
  });

  it("junta todos los errores en una sola respuesta", () => {
    const req = { body: { nombre: "", edad: -5 } };
    const res = armarRes();

    validateBody(esquema)(req, res, vi.fn());

    expect(res.json.mock.calls[0][0].detalles.length).toBeGreaterThan(1);
  });

  it("un body ausente da 400, no una excepcion", () => {
    //express 5 deja req.body en undefined cuando no llega nada
    const req = { body: undefined };
    const res = armarRes();
    const next = vi.fn();

    expect(() => validateBody(esquema)(req, res, next)).not.toThrow();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });
});

describe("validateParams", () => {
  const paramsSchema = z
    .object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, "id invalido") })
    .strict();

  it("deja pasar el id bien formado", () => {
    const req = { params: { id: "64b7f3c2a1d4e5f6a7b8c9d0" } };
    const next = vi.fn();
    validateParams(paramsSchema)(req, armarRes(), next);
    expect(next).toHaveBeenCalled();
  });

  it("responde 400 antes de tocar la base con un id roto", () => {
    const req = { params: { id: "roto" } };
    const res = armarRes();
    const next = vi.fn();

    validateParams(paramsSchema)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });
});

describe("validateQuery", () => {
  const querySchema = z
    .object({ page: z.coerce.number().int().min(1).default(1) })
    .strict();

  it("deja el resultado en req.consulta", () => {
    const req = { query: { page: "3" } };
    const next = vi.fn();

    validateQuery(querySchema)(req, armarRes(), next);

    expect(req.consulta.page).toBe(3);
    expect(next).toHaveBeenCalled();
  });

  it("no pisa req.query: en express 5 es de solo lectura", () => {
    const req = { query: { page: "3" } };
    validateQuery(querySchema)(req, armarRes(), vi.fn());
    expect(req.query).toEqual({ page: "3" });
  });

  it("responde 400 con su propio mensaje cuando el query es invalido", () => {
    const req = { query: { page: "0" } };
    const res = armarRes();
    const next = vi.fn();

    validateQuery(querySchema)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].error).toBe("Parámetros de consulta inválidos");
    expect(next).not.toHaveBeenCalled();
  });

  it("sin query aplica los defaults igual", () => {
    const req = { query: {} };
    validateQuery(querySchema)(req, armarRes(), vi.fn());
    expect(req.consulta.page).toBe(1);
  });
});
