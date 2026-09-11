//se conecta al servidor que sirvio esta pagina
const socket = io();

const lista = document.getElementById("listaServicios");
const total = document.getElementById("total");
const enPantalla = document.getElementById("enPantalla");
const avisoNuevos = document.getElementById("avisoNuevos");

//cuantos servicios nuevos entraron mientras se miraba una pagina donde no van
let nuevosFuera = 0;

const contarFilas = () => lista.querySelectorAll("tr[data-id]").length;

//la fila nueva solo entra si esta pagina es la ultima y todavia tiene lugar.
//en cualquier otra pagina el servicio pertenece a otro tramo del listado
const entraEnEstaPagina = () =>
  lista.dataset.ultimaPagina === "si" &&
  contarFilas() < Number(lista.dataset.limit);
const listaReservas = document.getElementById("listaReservas");
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

  //el total de la coleccion sube siempre, este el servicio en esta pagina o no
  if (total) total.textContent = Number(total.textContent) + 1;

  if (!entraEnEstaPagina()) {
    nuevosFuera += 1;
    if (avisoNuevos) {
      avisoNuevos.hidden = false;
      avisoNuevos.textContent =
        nuevosFuera === 1
          ? "Se creó 1 servicio que entra en otra página del listado."
          : `Se crearon ${nuevosFuera} servicios que entran en otras páginas del listado.`;
    }
    return;
  }

  lista.querySelector(".vacio")?.remove();
  const fila = filaDeServicio(servicio);
  fila.classList.add("nuevo");
  lista.appendChild(fila);

  if (enPantalla) enPantalla.textContent = contarFilas();
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

const bloqueDeReserva = (reserva) => {
  const article = document.createElement("article");
  article.className = "reserva";
  article.dataset.id = reserva._id;

  const servicios = reserva.services?.length
    ? `<ul class="servicios">
        ${reserva.services
          .map(
            (item) =>
              `<li>${item.service?.name ?? "servicio"}
                <span class="cantidad">x${item.quantity}</span>
              </li>`,
          )
          .join("")}
      </ul>`
    : `<p class="sin-servicios">Sin servicios asociados.</p>`;

  article.innerHTML = `
    <header>
      <h3>${reserva.clientName}</h3>
      <span class="estado ${reserva.status}">${reserva.status}</span>
    </header>
    <p class="dato">${reserva.clientEmail}</p>
    <p class="dato">${new Date(reserva.date).toLocaleDateString("es-AR")} a las ${reserva.time}</p>
    ${servicios}
  `;
  return article;
};

socket.on("reservaCreada", (reserva) => {
  if (!listaReservas) return;

  listaReservas.querySelector(".vacio")?.remove();
  const bloque = bloqueDeReserva(reserva);
  bloque.classList.add("nuevo");
  listaReservas.appendChild(bloque);

  if (totalReservas) {
    totalReservas.textContent =
      listaReservas.querySelectorAll("article[data-id]").length;
  }
});

socket.on("reservaActualizada", (reserva) => {
  if (!listaReservas) return;

  const anterior = listaReservas.querySelector(
    `article[data-id="${reserva._id}"]`,
  );
  if (!anterior) return;

  const bloque = bloqueDeReserva(reserva);
  bloque.classList.add("actualizado");
  anterior.replaceWith(bloque);
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
