import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/services/services.service.js", () => ({
  getServices: vi.fn(),
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

beforeEach(() => {
  vi.clearAllMocks();
});

describe("renderServices", () => {
  it("renderiza la vista con los servicios convertidos a objeto plano", async () => {
    servicesService.getServices.mockResolvedValue([
      documento({ _id: "s1", name: "Mecánica" }),
    ]);
    const res = armarRes();

    await controller.renderServices(armarReq(), res);

    expect(res.render).toHaveBeenCalledWith("services", {
      title: "Servicios",
      services: [{ _id: "s1", name: "Mecánica" }],
    });
  });

  it("le pasa los filtros del query al service", async () => {
    servicesService.getServices.mockResolvedValue([]);
    await controller.renderServices(armarReq({ category: "gas" }), armarRes());
    expect(servicesService.getServices).toHaveBeenCalledWith({ category: "gas" });
  });

  it("renderiza la vista vacia y responde 500 si falla la consulta", async () => {
    servicesService.getServices.mockRejectedValue(new Error("caida"));
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
  it("cuenta los servicios disponibles y formatea la fecha de cada reserva", async () => {
    bookingsService.getBookingsWithServices.mockResolvedValue([
      documento({ _id: "b1", clientName: "Juan", date: "2026-09-15" }),
    ]);
    servicesService.getServices.mockResolvedValue([
      { available: true },
      { available: false },
      { available: true },
    ]);
    const res = armarRes();

    await controller.renderAvailability(armarReq(), res);

    const [vista, datos] = res.render.mock.calls[0];
    expect(vista).toBe("availability");
    expect(datos.total).toBe(3);
    expect(datos.disponibles).toBe(2);
    expect(datos.bookings[0].fecha).toBeTypeOf("string");
  });

  it("usa la consulta con populate, no el listado comun", async () => {
    bookingsService.getBookingsWithServices.mockResolvedValue([]);
    servicesService.getServices.mockResolvedValue([]);
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
