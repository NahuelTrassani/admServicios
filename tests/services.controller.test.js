import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/services/services.service.js", () => ({
  searchServices: vi.fn(),
  countServices: vi.fn(),
  getServiceById: vi.fn(),
  createService: vi.fn(),
  updateService: vi.fn(),
  deleteService: vi.fn(),
}));

vi.mock("../src/sockets/index.js", () => ({
  registrarActividad: vi.fn(),
}));

const servicesService = await import("../src/services/services.service.js");
const controller = await import("../src/controllers/services.controller.js");

//dobles de req y res: el controller solo necesita leer del primero y escribir en el segundo
const armarRes = () => {
  const res = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  return res;
};

const armarReq = (extra = {}) => ({
  params: {},
  query: {},
  body: {},
  app: { get: vi.fn(() => ({ emit: vi.fn() })) },
  ...extra,
});

const servicio = { _id: "abc", name: "Mecánica", available: true };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getServices", () => {
  const paginado = {
    services: [servicio],
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasPrevPage: false,
    hasNextPage: false,
    prevPage: null,
    nextPage: null,
  };

  it("responde 200 con el listado y los metadatos de paginacion", async () => {
    servicesService.searchServices.mockResolvedValue(paginado);
    const res = armarRes();
    await controller.getServices(armarReq({ consulta: {} }), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(paginado);
  });

  it("usa req.consulta, que es lo que dejo el middleware de validacion", async () => {
    servicesService.searchServices.mockResolvedValue(paginado);
    const criterios = { category: "mecanica", page: 2, limit: 5, sortBy: "price", order: "desc" };
    await controller.getServices(armarReq({ consulta: criterios }), armarRes());
    expect(servicesService.searchServices).toHaveBeenCalledWith(criterios);
  });

  it("responde 500 si el service falla", async () => {
    servicesService.searchServices.mockRejectedValue(new Error("caida"));
    const res = armarRes();
    await controller.getServices(armarReq({ consulta: {} }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("getServiceById", () => {
  it("responde 200 cuando existe", async () => {
    servicesService.getServiceById.mockResolvedValue(servicio);
    const res = armarRes();
    await controller.getServiceById(armarReq({ params: { id: "abc" } }), res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("responde 404 cuando el service devuelve null", async () => {
    servicesService.getServiceById.mockResolvedValue(null);
    const res = armarRes();
    await controller.getServiceById(armarReq({ params: { id: "xxx" } }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe("createService", () => {
  it("responde 201 con el servicio creado", async () => {
    servicesService.createService.mockResolvedValue(servicio);
    const res = armarRes();
    await controller.createService(armarReq({ body: servicio }), res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("responde 400 cuando el dato no es valido", async () => {
    //el service devuelve null tanto por campos faltantes como por schema rechazado
    servicesService.createService.mockResolvedValue(null);
    const res = armarRes();
    await controller.createService(armarReq({ body: {} }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("emite el evento cuando la creacion sale bien", async () => {
    servicesService.createService.mockResolvedValue(servicio);
    const emit = vi.fn();
    const req = armarReq({ body: servicio, app: { get: () => ({ emit }) } });
    await controller.createService(req, armarRes());
    expect(emit).toHaveBeenCalledWith("servicioCreado", servicio);
  });

  it("no emite nada cuando la creacion falla", async () => {
    servicesService.createService.mockResolvedValue(null);
    const emit = vi.fn();
    const req = armarReq({ body: {}, app: { get: () => ({ emit }) } });
    await controller.createService(req, armarRes());
    expect(emit).not.toHaveBeenCalled();
  });
});

describe("deleteService", () => {
  it("responde 200 con el servicio dado de baja", async () => {
    servicesService.deleteService.mockResolvedValue({ ...servicio, available: false });
    const res = armarRes();
    await controller.deleteService(armarReq({ params: { id: "abc" } }), res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("responde 404 si no existe", async () => {
    servicesService.deleteService.mockResolvedValue(null);
    const res = armarRes();
    await controller.deleteService(armarReq({ params: { id: "xxx" } }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
