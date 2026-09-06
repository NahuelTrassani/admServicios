import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/repositories/messages.repository.js", () => ({
  default: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

const messagesRepository = (
  await import("../src/repositories/messages.repository.js")
).default;
const messagesService = await import("../src/services/messages.service.js");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createMessage", () => {
  it("crea el mensaje cuando estan los dos campos", async () => {
    const data = { user: "juan@mail.com", message: "hola" };
    messagesRepository.create.mockResolvedValue({ _id: "abc", ...data });
    const result = await messagesService.createMessage(data);
    expect(result).not.toBeNull();
    expect(messagesRepository.create).toHaveBeenCalledWith(data);
  });

  it("devuelve null si el schema rechaza el dato", async () => {
    const error = new Error("Message validation failed");
    error.name = "ValidationError";
    messagesRepository.create.mockRejectedValue(error);

    const result = await messagesService.createMessage({ message: "hola" });
    expect(result).toBeNull();
  });

  it("propaga los errores que no son de validacion", async () => {
    messagesRepository.create.mockRejectedValue(new Error("conexion perdida"));
    await expect(
      messagesService.createMessage({ user: "juan", message: "hola" }),
    ).rejects.toThrow("conexion perdida");
  });

  it("rechaza cuando no viene el body", async () => {
    const result = await messagesService.createMessage(undefined);
    expect(result).toBeNull();
  });
});

describe("getMessages", () => {
  it("devuelve el listado del repository", async () => {
    const mensajes = [{ user: "juan", message: "hola" }];
    messagesRepository.getAll.mockResolvedValue(mensajes);
    const result = await messagesService.getMessages();
    expect(result).toEqual(mensajes);
  });
});

describe("getMessageById", () => {
  it("devuelve null cuando no existe", async () => {
    messagesRepository.getById.mockResolvedValue(null);
    const result = await messagesService.getMessageById("noexiste");
    expect(result).toBeNull();
  });
});
