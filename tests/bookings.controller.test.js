import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/services/bookings.service.js", () => ({
  createBooking: vi.fn(),
  getBookingById: vi.fn(),
  getBookingWithServices: vi.fn(),
  addServiceToBooking: vi.fn(),
  updateServiceQuantity: vi.fn(),
  removeServiceFromBooking: vi.fn(),
  emptyBooking: vi.fn(),
  deleteBooking: vi.fn(),
}));

vi.mock("../src/services/services.service.js", () => ({
  getServiceById: vi.fn(),
}));

vi.mock("../src/sockets/index.js", () => ({
  registrarActividad: vi.fn(),
}));

const bookingService = await import("../src/services/bookings.service.js");
const controller = await import("../src/controllers/bookings.controller.js");
const { TurnoOcupadoError } = await import("../src/utils/errors.js");

const armarRes = () => {
  const res = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  return res;
};

const armarReq = (extra = {}) => ({
  params: { bid: "b1", sid: "s1" },
  body: {},
  app: { get: vi.fn(() => ({ emit: vi.fn() })) },
  ...extra,
});

const reserva = { _id: "b1", clientName: "Juan", services: [] };

beforeEach(() => {
  vi.resetAllMocks();
});

describe("createBooking", () => {
  it("responde 201 con la reserva creada", async () => {
    bookingService.createBooking.mockResolvedValue(reserva);
    const res = armarRes();
    await controller.createBooking(armarReq({ body: reserva }), res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("responde 409 si el turno ya esta ocupado, con el turno en el cuerpo", async () => {
    bookingService.createBooking.mockRejectedValue(
      new TurnoOcupadoError("2026-10-01", "10:00"),
    );
    const res = armarRes();

    await controller.createBooking(armarReq(), res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error: "El turno seleccionado ya no está disponible",
      turno: { date: "2026-10-01", time: "10:00" },
    });
  });

  it("cualquier otro error sigue siendo 500", async () => {
    bookingService.createBooking.mockRejectedValue(new Error("caida"));
    const res = armarRes();
    await controller.createBooking(armarReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("updateServiceQuantity", () => {
  it("responde 404 de reserva si la reserva no existe", async () => {
    bookingService.getBookingById.mockResolvedValue(null);
    const res = armarRes();
    await controller.updateServiceQuantity(armarReq({ body: { quantity: 3 } }), res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Reserva no encontrada" });
  });

  it("distingue cuando el servicio no forma parte de la reserva", async () => {
    bookingService.getBookingById.mockResolvedValue(reserva);
    bookingService.updateServiceQuantity.mockResolvedValue(null);
    const res = armarRes();
    await controller.updateServiceQuantity(armarReq({ body: { quantity: 3 } }), res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: "El servicio no forma parte de la reserva",
    });
  });

  it("responde 200 y avisa por socket con la reserva poblada", async () => {
    bookingService.getBookingById.mockResolvedValue(reserva);
    bookingService.updateServiceQuantity.mockResolvedValue(reserva);
    bookingService.getBookingWithServices.mockResolvedValue({ ...reserva, poblada: true });
    const emit = vi.fn();
    const res = armarRes();

    await controller.updateServiceQuantity(
      armarReq({ body: { quantity: 3 }, app: { get: () => ({ emit }) } }),
      res,
    );

    expect(bookingService.updateServiceQuantity).toHaveBeenCalledWith("b1", "s1", 3);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(emit).toHaveBeenCalledWith("reservaActualizada", { ...reserva, poblada: true });
  });
});

describe("removeServiceFromBooking", () => {
  it("responde 404 si el servicio no esta en la reserva", async () => {
    bookingService.getBookingById.mockResolvedValue(reserva);
    bookingService.removeServiceFromBooking.mockResolvedValue(null);
    const res = armarRes();
    await controller.removeServiceFromBooking(armarReq(), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("responde 200 cuando lo quita", async () => {
    bookingService.getBookingById.mockResolvedValue(reserva);
    bookingService.removeServiceFromBooking.mockResolvedValue(reserva);
    const res = armarRes();
    await controller.removeServiceFromBooking(armarReq(), res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe("emptyBooking", () => {
  it("responde 404 si la reserva no existe", async () => {
    bookingService.emptyBooking.mockResolvedValue(null);
    const res = armarRes();
    await controller.emptyBooking(armarReq(), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("responde 200 con la reserva vacia", async () => {
    bookingService.emptyBooking.mockResolvedValue(reserva);
    const res = armarRes();
    await controller.emptyBooking(armarReq(), res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe("deleteBooking", () => {
  it("responde 404 si la reserva no existe", async () => {
    bookingService.deleteBooking.mockResolvedValue(null);
    const res = armarRes();
    await controller.deleteBooking(armarReq(), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("responde 200 y avisa por socket solo con el id", async () => {
    bookingService.deleteBooking.mockResolvedValue(reserva);
    const emit = vi.fn();
    const res = armarRes();

    await controller.deleteBooking(armarReq({ app: { get: () => ({ emit }) } }), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(emit).toHaveBeenCalledWith("reservaEliminada", { _id: "b1" });
  });
});
