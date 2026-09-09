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
