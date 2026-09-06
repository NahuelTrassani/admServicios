import { describe, it, expect, vi, beforeEach } from "vitest";

//se reemplaza el repository por un doble, asi los tests no tocan MongoDB
vi.mock("../src/repositories/services.repository.js", () => ({
  default: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

const servicesRepository = (
  await import("../src/repositories/services.repository.js")
).default;
const servicesService = await import("../src/services/services.service.js");

const servicioBase = {
  name: "Mecánica",
  description: "Servicio de mecanica general",
  duration: 30,
  price: 9500,
  category: "mecanica",
  available: true,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getServices", () => {
  const catalogo = [
    { ...servicioBase, category: "mecanica", available: true },
    { ...servicioBase, category: "informatica", available: false },
    { ...servicioBase, category: "mecanica", available: false },
  ];

  it("sin filtros devuelve todos", async () => {
    servicesRepository.getAll.mockResolvedValue(catalogo);
    const result = await servicesService.getServices();
    expect(result).toHaveLength(3);
  });

  it("filtra por categoria", async () => {
    servicesRepository.getAll.mockResolvedValue(catalogo);
    const result = await servicesService.getServices({ category: "mecanica" });
    expect(result).toHaveLength(2);
    result.forEach((s) => expect(s.category).toBe("mecanica"));
  });

  it("filtra por disponibilidad convirtiendo el string a booleano", async () => {
    servicesRepository.getAll.mockResolvedValue(catalogo);
    const result = await servicesService.getServices({ available: "true" });
    expect(result).toHaveLength(1);
    expect(result[0].available).toBe(true);
  });

  it("combina los dos filtros", async () => {
    servicesRepository.getAll.mockResolvedValue(catalogo);
    const result = await servicesService.getServices({
      category: "mecanica",
      available: "false",
    });
    expect(result).toHaveLength(1);
  });
});

describe("createService", () => {
  it("crea el servicio cuando estan todos los campos", async () => {
    servicesRepository.create.mockResolvedValue({ _id: "abc", ...servicioBase });
    const result = await servicesService.createService(servicioBase);
    expect(result).not.toBeNull();
    expect(servicesRepository.create).toHaveBeenCalledWith(servicioBase);
  });

  it("devuelve null si el schema rechaza el dato", async () => {
    //la validacion de campos vive en el modelo: el service traduce el error a null
    const error = new Error("Service validation failed");
    error.name = "ValidationError";
    servicesRepository.create.mockRejectedValue(error);

    const { price, ...sinPrecio } = servicioBase;
    const result = await servicesService.createService(sinPrecio);
    expect(result).toBeNull();
  });

  it("propaga los errores que no son de validacion", async () => {
    //si se cae la base no es culpa del cliente: tiene que llegar al controller como 500
    servicesRepository.create.mockRejectedValue(new Error("conexion perdida"));
    await expect(servicesService.createService(servicioBase)).rejects.toThrow(
      "conexion perdida",
    );
  });

  it("rechaza cuando no viene el body", async () => {
    const result = await servicesService.createService(undefined);
    expect(result).toBeNull();
    expect(servicesRepository.create).not.toHaveBeenCalled();
  });

  it("acepta price 0 porque es un valor valido", async () => {
    servicesRepository.create.mockResolvedValue({ _id: "abc", price: 0 });
    const result = await servicesService.createService({
      ...servicioBase,
      price: 0,
    });
    expect(result).not.toBeNull();
  });

  it("acepta available false porque es un valor valido", async () => {
    servicesRepository.create.mockResolvedValue({ _id: "abc" });
    const result = await servicesService.createService({
      ...servicioBase,
      available: false,
    });
    expect(result).not.toBeNull();
  });
});

describe("deleteService", () => {
  it("da de baja marcando available en false, no borra el documento", async () => {
    servicesRepository.update.mockResolvedValue({ available: false });
    const result = await servicesService.deleteService("abc123");
    expect(servicesRepository.update).toHaveBeenCalledWith("abc123", {
      available: false,
    });
    expect(result.available).toBe(false);
  });
});

describe("getServiceById", () => {
  it("delega la busqueda en el repository", async () => {
    servicesRepository.getById.mockResolvedValue(servicioBase);
    const result = await servicesService.getServiceById("abc123");
    expect(servicesRepository.getById).toHaveBeenCalledWith("abc123");
    expect(result).toEqual(servicioBase);
  });

  it("devuelve null cuando no existe", async () => {
    servicesRepository.getById.mockResolvedValue(null);
    const result = await servicesService.getServiceById("noexiste");
    expect(result).toBeNull();
  });
});
