import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/repositories/bookings.repository.js", () => ({
  default: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("../src/services/services.service.js", () => ({
  getServiceById: vi.fn(),
}));

const bookingsRepository = (
  await import("../src/repositories/bookings.repository.js")
).default;
const { getServiceById } = await import("../src/services/services.service.js");
const bookingsService = await import("../src/services/bookings.service.js");

const SERVICIO_ID = "68b1f2a4c9e77d3b1a4f0012";
const OTRO_SERVICIO_ID = "68b1f2a4c9e77d3b1a4f0044";
const RESERVA_ID = "68b1f2a4c9e77d3b1a4f0099";

const reservaBase = {
  clientName: "Juan",
  clientEmail: "juan@mail.com",
  date: "2026-09-15",
  time: "10:30",
  status: "pendiente",
};

//los ObjectId de mongoose no son strings: se comparan con toString()
const objectId = (valor) => ({ toString: () => valor });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createBooking", () => {
  it("crea la reserva cuando estan todos los campos", async () => {
    bookingsRepository.create.mockResolvedValue({ _id: RESERVA_ID, services: [] });
    const result = await bookingsService.createBooking(reservaBase);
    expect(result).not.toBeNull();
    expect(bookingsRepository.create).toHaveBeenCalledWith(reservaBase);
  });

  it("devuelve null si el schema rechaza el dato", async () => {
    const error = new Error("Booking validation failed");
    error.name = "ValidationError";
    bookingsRepository.create.mockRejectedValue(error);

    const { clientEmail, ...sinEmail } = reservaBase;
    const result = await bookingsService.createBooking(sinEmail);
    expect(result).toBeNull();
  });

  it("propaga los errores que no son de validacion", async () => {
    bookingsRepository.create.mockRejectedValue(new Error("conexion perdida"));
    await expect(bookingsService.createBooking(reservaBase)).rejects.toThrow(
      "conexion perdida",
    );
  });

  it("rechaza cuando no viene el body", async () => {
    const result = await bookingsService.createBooking(undefined);
    expect(result).toBeNull();
  });
});

describe("addServiceToBooking", () => {
  it("devuelve null si la reserva no existe", async () => {
    bookingsRepository.getById.mockResolvedValue(null);
    const result = await bookingsService.addServiceToBooking(
      RESERVA_ID,
      SERVICIO_ID,
    );
    expect(result).toBeNull();
    expect(bookingsRepository.update).not.toHaveBeenCalled();
  });

  it("devuelve null si el servicio no existe", async () => {
    bookingsRepository.getById.mockResolvedValue({ ...reservaBase, services: [] });
    getServiceById.mockResolvedValue(null);
    const result = await bookingsService.addServiceToBooking(
      RESERVA_ID,
      SERVICIO_ID,
    );
    expect(result).toBeNull();
    expect(bookingsRepository.update).not.toHaveBeenCalled();
  });

  it("agrega el servicio con quantity 1 cuando la reserva esta vacia", async () => {
    const reserva = { ...reservaBase, services: [] };
    bookingsRepository.getById.mockResolvedValue(reserva);
    getServiceById.mockResolvedValue({ _id: SERVICIO_ID });
    bookingsRepository.update.mockImplementation((id, data) => data);

    await bookingsService.addServiceToBooking(RESERVA_ID, SERVICIO_ID);

    const [, data] = bookingsRepository.update.mock.calls[0];
    expect(data.services).toHaveLength(1);
    expect(data.services[0]).toEqual({ service: SERVICIO_ID, quantity: 1 });
  });

  it("incrementa quantity si el servicio ya estaba, sin duplicar la entrada", async () => {
    const reserva = {
      ...reservaBase,
      services: [{ service: objectId(SERVICIO_ID), quantity: 1 }],
    };
    bookingsRepository.getById.mockResolvedValue(reserva);
    getServiceById.mockResolvedValue({ _id: SERVICIO_ID });
    bookingsRepository.update.mockImplementation((id, data) => data);

    await bookingsService.addServiceToBooking(RESERVA_ID, SERVICIO_ID);

    const [, data] = bookingsRepository.update.mock.calls[0];
    expect(data.services).toHaveLength(1);
    expect(data.services[0].quantity).toBe(2);
  });

  it("agrega una entrada nueva si el servicio es distinto", async () => {
    const reserva = {
      ...reservaBase,
      services: [{ service: objectId(SERVICIO_ID), quantity: 2 }],
    };
    bookingsRepository.getById.mockResolvedValue(reserva);
    getServiceById.mockResolvedValue({ _id: OTRO_SERVICIO_ID });
    bookingsRepository.update.mockImplementation((id, data) => data);

    await bookingsService.addServiceToBooking(RESERVA_ID, OTRO_SERVICIO_ID);

    const [, data] = bookingsRepository.update.mock.calls[0];
    expect(data.services).toHaveLength(2);
    expect(data.services[0].quantity).toBe(2);
    expect(data.services[1].quantity).toBe(1);
  });

  it("guarda solo la referencia al servicio, nunca el documento completo", async () => {
    const reserva = { ...reservaBase, services: [] };
    bookingsRepository.getById.mockResolvedValue(reserva);
    getServiceById.mockResolvedValue({
      _id: SERVICIO_ID,
      name: "Mecánica",
      price: 9500,
    });
    bookingsRepository.update.mockImplementation((id, data) => data);

    await bookingsService.addServiceToBooking(RESERVA_ID, SERVICIO_ID);

    const [, data] = bookingsRepository.update.mock.calls[0];
    expect(Object.keys(data.services[0]).sort()).toEqual(["quantity", "service"]);
  });
});

describe("getBookingById", () => {
  it("delega la busqueda en el repository", async () => {
    bookingsRepository.getById.mockResolvedValue(reservaBase);
    const result = await bookingsService.getBookingById(RESERVA_ID);
    expect(bookingsRepository.getById).toHaveBeenCalledWith(RESERVA_ID);
    expect(result).toEqual(reservaBase);
  });
});
