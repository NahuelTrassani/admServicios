import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/services/services.service.js", () => ({
  searchServices: vi.fn(),
  countServices: vi.fn(),
}));

vi.mock("../src/services/bookings.service.js", () => ({
  getBookingsWithServices: vi.fn(),
}));

vi.mock("../src/services/messages.service.js", () => ({
  getLatestMessages: vi.fn(),
}));

const servicesService = await import("../src/services/services.service.js");
const bookingsService = await import("../src/services/bookings.service.js");
const messagesService = await import("../src/services/messages.service.js");
const controller = await import("../src/controllers/views.controller.js");

const armarRes = () => {
  const res = {};
  res.status = vi.fn(() => res);
  res.render = vi.fn(() => res);
  return res;
};

const armarReq = (query = {}) => ({ query });

//los documentos de mongoose se pasan a objeto plano antes de llegar a handlebars
const documento = (datos) => ({ ...datos, toObject: () => datos });

const paginado = (services = []) => ({
  services,
  total: services.length,
  page: 1,
  limit: 50,
  totalPages: 1,
  hasPrevPage: false,
  hasNextPage: false,
  prevPage: null,
  nextPage: null,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("renderServices", () => {
  it("renderiza la vista con los servicios convertidos a objeto plano", async () => {
    servicesService.searchServices.mockResolvedValue(
      paginado([documento({ _id: "s1", name: "Mecánica" })]),
    );
    const res = armarRes();

    await controller.renderServices(armarReq(), res);

    const [vista, datos] = res.render.mock.calls[0];
    expect(vista).toBe("services");
    expect(datos.services).toEqual([{ _id: "s1", name: "Mecánica" }]);
  });

  it("manda a la vista los metadatos de paginacion", async () => {
    servicesService.searchServices.mockResolvedValue(paginado());
    const res = armarRes();

    await controller.renderServices(armarReq(), res);

    const [, datos] = res.render.mock.calls[0];
    expect(datos.paginacion).toMatchObject({
      total: 0,
      limit: 50,
      page: 1,
      totalPages: 1,
      hasPrevPage: false,
      hasNextPage: false,
    });
  });

  it("valida el query con el mismo schema que la API y aplica los defaults", async () => {
    servicesService.searchServices.mockResolvedValue(paginado());

    await controller.renderServices(armarReq({ category: "gas" }), armarRes());

    expect(servicesService.searchServices).toHaveBeenCalledWith({
      category: "gas",
      page: 1,
      limit: 50,
      sortBy: "name",
      order: "asc",
    });
  });

  it("respeta el limit que llega por query en vez del default de la vista", async () => {
    servicesService.searchServices.mockResolvedValue(paginado());

    await controller.renderServices(armarReq({ limit: "5", page: "2" }), armarRes());

    const criterios = servicesService.searchServices.mock.calls[0][0];
    expect(criterios.limit).toBe(5);
    expect(criterios.page).toBe(2);
  });

  it("renderiza la vista vacia y responde 500 si el query es invalido", async () => {
    const res = armarRes();

    //sortBy no esta en el enum: el parse tira y cae en el catch
    await controller.renderServices(armarReq({ sortBy: "inventado" }), res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(servicesService.searchServices).not.toHaveBeenCalled();
  });

  it("renderiza la vista vacia y responde 500 si falla la consulta", async () => {
    servicesService.searchServices.mockRejectedValue(new Error("caida"));
    const res = armarRes();

    await controller.renderServices(armarReq(), res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.render).toHaveBeenCalledWith(
      "services",
      expect.objectContaining({ services: [] }),
    );
  });
});

describe("renderAvailability", () => {
  it("cuenta los servicios en la base y formatea la fecha de cada reserva", async () => {
    bookingsService.getBookingsWithServices.mockResolvedValue([
      documento({ _id: "b1", clientName: "Juan", date: "2026-09-15" }),
    ]);
    servicesService.countServices
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(2);
    const res = armarRes();

    await controller.renderAvailability(armarReq(), res);

    const [vista, datos] = res.render.mock.calls[0];
    expect(vista).toBe("availability");
    expect(datos.total).toBe(3);
    expect(datos.disponibles).toBe(2);
    expect(datos.bookings[0].fecha).toBeTypeOf("string");
  });

  it("cuenta los disponibles con un filtro, no trayendo documentos", async () => {
    bookingsService.getBookingsWithServices.mockResolvedValue([]);
    servicesService.countServices.mockResolvedValue(0);

    await controller.renderAvailability(armarReq(), armarRes());

    expect(servicesService.countServices).toHaveBeenCalledWith();
    expect(servicesService.countServices).toHaveBeenCalledWith({ available: true });
  });

  it("usa la consulta con populate, no el listado comun", async () => {
    bookingsService.getBookingsWithServices.mockResolvedValue([]);
    servicesService.countServices.mockResolvedValue(0);
    await controller.renderAvailability(armarReq(), armarRes());
    expect(bookingsService.getBookingsWithServices).toHaveBeenCalled();
  });
});

describe("renderActivity", () => {
  it("renderiza las novedades con el momento formateado", async () => {
    messagesService.getLatestMessages.mockResolvedValue([
      documento({ _id: "m1", user: "sistema", createdAt: "2026-09-09T14:00:00Z" }),
    ]);
    const res = armarRes();

    await controller.renderActivity(armarReq(), res);

    const [vista, datos] = res.render.mock.calls[0];
    expect(vista).toBe("activity");
    expect(datos.messages[0].momento).toBeTypeOf("string");
  });

  it("responde 500 con la lista vacia si falla", async () => {
    messagesService.getLatestMessages.mockRejectedValue(new Error("caida"));
    const res = armarRes();
    await controller.renderActivity(armarReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
