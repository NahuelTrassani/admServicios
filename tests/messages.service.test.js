import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/repositories/messages.repository.js", () => ({
  default: {
    getAll: vi.fn(),
    getLatest: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
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

describe("getLatestMessages", () => {
  it("pide el orden y el limite a la base, no filtra en memoria", async () => {
    messagesRepository.getLatest.mockResolvedValue([]);
    await messagesService.getLatestMessages(5);
    expect(messagesRepository.getLatest).toHaveBeenCalledWith(5);
    expect(messagesRepository.getAll).not.toHaveBeenCalled();
  });

  it("usa 20 como limite por defecto", async () => {
    messagesRepository.getLatest.mockResolvedValue([]);
    await messagesService.getLatestMessages();
    expect(messagesRepository.getLatest).toHaveBeenCalledWith(20);
  });
});

describe("updateMessage", () => {
  it("actualiza cuando el dato es valido", async () => {
    messagesRepository.update.mockResolvedValue({ _id: "m1", message: "editado" });
    const result = await messagesService.updateMessage("m1", { message: "editado" });
    expect(result.message).toBe("editado");
  });

  it("devuelve null si el schema rechaza el dato", async () => {
    const error = new Error("validation failed");
    error.name = "ValidationError";
    messagesRepository.update.mockRejectedValue(error);
    const result = await messagesService.updateMessage("m1", { message: "" });
    expect(result).toBeNull();
  });

  it("propaga los errores que no son de validacion", async () => {
    messagesRepository.update.mockRejectedValue(new Error("conexion perdida"));
    await expect(messagesService.updateMessage("m1", {})).rejects.toThrow("conexion perdida");
  });
});

describe("deleteMessage", () => {
  it("borra fisicamente: un mensaje no lo referencia ningun documento", async () => {
    messagesRepository.delete.mockResolvedValue({ _id: "m1" });
    const result = await messagesService.deleteMessage("m1");
    expect(messagesRepository.delete).toHaveBeenCalledWith("m1");
    expect(result).not.toBeNull();
  });

  it("devuelve null cuando no existe", async () => {
    messagesRepository.delete.mockResolvedValue(null);
    const result = await messagesService.deleteMessage("noexiste");
    expect(result).toBeNull();
  });
});
