//se conecta al servidor que sirvio esta pagina
const socket = io();

const lista = document.getElementById("listaServicios");
const total = document.getElementById("total");
const totalReservas = document.getElementById("totalReservas");

const precio = (n) => `$${n}`;

const filaDeServicio = (servicio) => {
  const fila = document.createElement("tr");
  fila.dataset.id = servicio._id;
  fila.innerHTML = `
    <td>${servicio.name}</td>
    <td>${servicio.description}</td>
    <td>${servicio.duration} min</td>
    <td>${precio(servicio.price)}</td>
    <td>${servicio.category}</td>
    <td>
      <span class="estado ${servicio.available ? "si" : "no"}">
        ${servicio.available ? "disponible" : "no disponible"}
      </span>
    </td>
  `;
  return fila;
};

//alguien creo un servicio desde la API: se agrega la fila sin recargar
socket.on("servicioCreado", (servicio) => {
  if (!lista) return;

  lista.querySelector(".vacio")?.remove();
  const fila = filaDeServicio(servicio);
  fila.classList.add("nuevo");
  lista.appendChild(fila);

  if (total) {
    total.textContent = lista.querySelectorAll("tr[data-id]").length;
  }
});

//se modifico o se dio de baja: se reemplaza la fila correspondiente
socket.on("servicioActualizado", (servicio) => {
  if (!lista) return;

  const anterior = lista.querySelector(`tr[data-id="${servicio._id}"]`);
  if (!anterior) return;

  const fila = filaDeServicio(servicio);
  fila.classList.add("actualizado");
  anterior.replaceWith(fila);
});

//las reservas cambian poco y su vista incluye datos relacionados,
//asi que se recarga en lugar de reconstruir el html a mano
socket.on("reservaCreada", () => {
  if (totalReservas) window.location.reload();
});

socket.on("reservaActualizada", () => {
  if (totalReservas) window.location.reload();
});

// ---- panel de actividad ----

const listaActividad = document.getElementById("listaActividad");
const formNota = document.getElementById("formNota");
const errorNota = document.getElementById("errorNota");

const itemDeActividad = ({ _id, user, message, createdAt }) => {
  const item = document.createElement("li");
  item.dataset.id = _id;
  item.classList.add("nuevo");
  item.innerHTML = `
    <span class="autor">${user}</span>
    <span class="texto">${message}</span>
    <span class="momento">${new Date(createdAt).toLocaleString("es-AR")}</span>
  `;
  return item;
};

//el cliente le manda la nota al servidor: aca el socket va en la direccion contraria
formNota?.addEventListener("submit", (evento) => {
  evento.preventDefault();

  const user = document.getElementById("usuario").value.trim();
  const message = document.getElementById("nota").value.trim();

  socket.emit("nuevaNota", { user, message });
  document.getElementById("nota").value = "";
});

//el servidor confirma y difunde a todos los paneles abiertos
socket.on("actividadRegistrada", (nota) => {
  if (!listaActividad) return;

  listaActividad.querySelector(".vacio")?.remove();
  listaActividad.prepend(itemDeActividad(nota));
  if (errorNota) errorNota.hidden = true;
});

//solo le llega a quien intento publicar
socket.on("notaRechazada", ({ error }) => {
  if (!errorNota) return;
  errorNota.textContent = error;
  errorNota.hidden = false;
});

//una nota editada o borrada desde la API tambien se refleja en el panel
socket.on("actividadEditada", (nota) => {
  if (!listaActividad) return;

  const items = [...listaActividad.querySelectorAll("li")];
  const item = items.find((li) => li.dataset.id === nota._id);
  if (item) item.replaceWith(itemDeActividad(nota));
});

socket.on("actividadEliminada", (nota) => {
  if (!listaActividad) return;

  const items = [...listaActividad.querySelectorAll("li")];
  items.find((li) => li.dataset.id === nota._id)?.remove();
});
