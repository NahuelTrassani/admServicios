import { describe, it, expect, vi, beforeEach } from "vitest";

//se reemplaza el repository por un doble, asi los tests no tocan MongoDB
vi.mock("../src/repositories/services.repository.js", () => ({
  default: {
    search: vi.fn(),
    count: vi.fn(),
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

describe("searchServices", () => {
  const criterios = {
    category: "mecanica",
    available: "true",
    page: 2,
    limit: 10,
    sortBy: "price",
    order: "desc",
  };

  it("le delega la consulta al repository tal cual la recibe", async () => {
    servicesRepository.search.mockResolvedValue({ items: [], total: 0 });
    await servicesService.searchServices(criterios);
    expect(servicesRepository.search).toHaveBeenCalledWith(criterios);
  });

  it("arma los metadatos de paginacion a partir del total", async () => {
    servicesRepository.search.mockResolvedValue({
      items: [servicioBase],
      total: 42,
    });

    const result = await servicesService.searchServices({
      page: 2,
      limit: 10,
      sortBy: "name",
      order: "asc",
    });

    expect(result).toMatchObject({
      services: [servicioBase],
      total: 42,
      page: 2,
      limit: 10,
      totalPages: 5,
      hasPrevPage: true,
      hasNextPage: true,
      prevPage: 1,
      nextPage: 3,
    });
  });

  it("en la primera pagina no hay anterior", async () => {
    servicesRepository.search.mockResolvedValue({ items: [], total: 5 });
    const result = await servicesService.searchServices({ page: 1, limit: 10 });
    expect(result.hasPrevPage).toBe(false);
    expect(result.prevPage).toBe(null);
  });

  it("en la ultima pagina no hay siguiente", async () => {
    servicesRepository.search.mockResolvedValue({ items: [], total: 20 });
    const result = await servicesService.searchServices({ page: 2, limit: 10 });
    expect(result.hasNextPage).toBe(false);
    expect(result.nextPage).toBe(null);
  });

  it("sin resultados devuelve una sola pagina, no cero", async () => {
    servicesRepository.search.mockResolvedValue({ items: [], total: 0 });
    const result = await servicesService.searchServices({ page: 1, limit: 10 });
    expect(result.totalPages).toBe(1);
    expect(result.hasNextPage).toBe(false);
  });
});

describe("countServices", () => {
  it("cuenta sin filtro", async () => {
    servicesRepository.count.mockResolvedValue(7);
    expect(await servicesService.countServices()).toBe(7);
    expect(servicesRepository.count).toHaveBeenCalledWith({});
  });

  it("le pasa el filtro al repository", async () => {
    servicesRepository.count.mockResolvedValue(3);
    await servicesService.countServices({ available: true });
    expect(servicesRepository.count).toHaveBeenCalledWith({ available: true });
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
