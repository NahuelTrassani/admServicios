import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/services/messages.service.js", () => ({
  createMessage: vi.fn(),
}));

const messagesService = await import("../src/services/messages.service.js");
const { registrarSockets, registrarActividad } = await import(
  "../src/sockets/index.js"
);

//doble de socket.io: guarda los handlers registrados para poder dispararlos
const armarIo = () => {
  const handlers = {};
  const socket = {
    id: "socket-1",
    emit: vi.fn(),
    on: vi.fn((evento, fn) => {
      handlers[evento] = fn;
    }),
  };
  const io = {
    emit: vi.fn(),
    on: vi.fn((evento, fn) => {
      if (evento === "connection") fn(socket);
    }),
  };
  return { io, socket, handlers };
};

const nota = { _id: "m1", user: "Nahuel", message: "cerrado el 20" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("registrarSockets", () => {
  it("queda escuchando nuevaNota al conectarse un cliente", () => {
    const { io, handlers } = armarIo();
    registrarSockets(io);
    expect(handlers.nuevaNota).toBeTypeOf("function");
  });

  it("guarda la nota y la difunde a todos los clientes", async () => {
    const { io, handlers } = armarIo();
    registrarSockets(io);
    messagesService.createMessage.mockResolvedValue(nota);

    await handlers.nuevaNota({ user: "Nahuel", message: "cerrado el 20" });

    expect(messagesService.createMessage).toHaveBeenCalledWith({
      user: "Nahuel",
      message: "cerrado el 20",
    });
    expect(io.emit).toHaveBeenCalledWith("actividadRegistrada", nota);
  });

  it("le avisa solo a quien la envio cuando la nota no es valida", async () => {
    const { io, socket, handlers } = armarIo();
    registrarSockets(io);
    messagesService.createMessage.mockResolvedValue(null);

    await handlers.nuevaNota({ user: "", message: "sin autor" });

    expect(socket.emit).toHaveBeenCalledWith("notaRechazada", {
      error: "El usuario y el mensaje son obligatorios",
    });
    //no se difunde a los demas
    expect(io.emit).not.toHaveBeenCalled();
  });
});

describe("registrarActividad", () => {
  it("guarda la novedad y la difunde", async () => {
    const io = { emit: vi.fn() };
    messagesService.createMessage.mockResolvedValue(nota);

    await registrarActividad(io, "sistema", "Se creo el servicio X");

    expect(messagesService.createMessage).toHaveBeenCalledWith({
      user: "sistema",
      message: "Se creo el servicio X",
    });
    expect(io.emit).toHaveBeenCalledWith("actividadRegistrada", nota);
  });

  it("no difunde nada si el mensaje no se pudo guardar", async () => {
    const io = { emit: vi.fn() };
    messagesService.createMessage.mockResolvedValue(null);

    await registrarActividad(io, "", "");

    expect(io.emit).not.toHaveBeenCalled();
  });

  it("no rompe si todavia no hay instancia de io", async () => {
    messagesService.createMessage.mockResolvedValue(nota);
    await expect(
      registrarActividad(undefined, "sistema", "algo"),
    ).resolves.toEqual(nota);
  });
});
