# API REST - Sistema de Turnos y Reservas

Pre-entrega 4 del curso Programación Backend I (CoderHouse).

API REST construida con Express que expone dos recursos: `services` (los servicios que pueden reservarse) y `bookings` (las reservas de los clientes), con persistencia en archivos JSON.

El proyecto está organizado en tres capas, cada una con una responsabilidad única.

## Nota sobre el DELETE de servicios

**El `DELETE /api/services/:sid` realiza una baja lógica, no un borrado físico.** Esta implementación responde a la consigna dada en clase por el profesor.

La baja se registra en el campo `available` de la instancia: al eliminar un servicio, su `available` pasa a `false`. El registro permanece en `services.json` y sigue siendo consultable por su id.

Comportamiento esperado al probar el endpoint:

```
DELETE /api/services/3   ->  200, devuelve el servicio con "available": false
GET    /api/services/3   ->  200, el registro sigue existiendo, ahora con "available": false
```

Que el servicio siga respondiendo después del DELETE **no es un error**: es el resultado de la baja lógica. El servicio queda marcado como no disponible en lugar de desaparecer del archivo.

Motivo de la decisión: preservar la integridad referencial. Las reservas guardan referencias al `id` del servicio, y un borrado físico dejaría esas reservas apuntando a un registro inexistente. Con la baja lógica se conserva el historial de reservas y el dato sigue siendo consultable.

Para listar únicamente los servicios activos se usa el filtro por query param:

```
GET /api/services?available=true
```

## Instalación

```bash
pnpm install
```

## Configuración

Copiar `.env.example` como `.env` y completar las variables:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| PORT | Puerto de la aplicación | 8080 |
| NODE_ENV | Entorno de ejecución | development |

La app valida las variables al iniciar: si falta alguna, el proceso se cierra con un mensaje de error.

## Ejecución

```bash
pnpm start        # ejecuta la app
pnpm run dev      # modo desarrollo con reinicio automático
```

El servidor queda escuchando en `http://localhost:8080`.

## Organización en capas

Una petición atraviesa tres capas antes de llegar a los datos, y cada una hace una sola cosa:

```
cliente  ->  router  ->  controller  ->  manager  ->  archivo JSON
```

**Routers.** Declaran los endpoints y los asocian con la función del controller que los atiende. No contienen lógica: ni validaciones, ni acceso a datos, ni manejo de la respuesta.

```js
// src/routes/services.router.js
router.get("/:id", getServiceById);
router.post("/", createService);
```

**Controllers.** Son el puente con HTTP. Leen `req.params`, `req.query` y `req.body`, le piden el trabajo al manager y arman la respuesta con `res.status().json()`. No saben cómo ni dónde se guardan los datos.

```js
// src/controllers/services.controller.js
export const getServiceById = async (req, res) => {
  const serviceId = req.params.id;
  const service = await serviceManager.getServiceById(serviceId);
  ...
};
```

**Managers.** Manejan los datos y las reglas de negocio: leen y escriben los archivos JSON, generan los ids, validan los campos obligatorios. No conocen Express: no reciben `req` ni `res`, y devuelven datos o `null`.

```js
// src/managers/ServiceManager.js
async getServiceById(id) {
  const services = await this.getServices();
  return services.find((s) => s.id === numberId) || null;
}
```

La ventaja concreta de esta separación: cuando en las próximas etapas la persistencia pase de archivos JSON a MongoDB, solo cambian los managers. Los routers y los controllers quedan intactos, y la API sigue respondiendo igual desde afuera.

## Estructura

```
src/
  config/
    env.config.js               configuración y validación de variables de entorno
  routes/
    services.router.js          endpoints de services
    bookings.router.js          endpoints de bookings
  controllers/
    services.controller.js      request/response de services
    bookings.controller.js      request/response de bookings
  managers/
    ServiceManager.js           datos y reglas de negocio de services
    BookingManager.js           datos y reglas de negocio de bookings
  data/
    services.json               persistencia de servicios
    bookings.json               persistencia de reservas
  app.js                        configuración de Express y montaje de routers
  server.js                     levanta el servidor
```

### Correspondencia entre capas

| Endpoint | Controller | Manager |
|---|---|---|
| `GET /api/services` | `getServices` | `ServiceManager.getServices` |
| `GET /api/services/:sid` | `getServiceById` | `ServiceManager.getServiceById` |
| `POST /api/services` | `createService` | `ServiceManager.addService` |
| `PUT /api/services/:sid` | `updateService` | `ServiceManager.updateService` |
| `DELETE /api/services/:sid` | `deleteService` | `ServiceManager.deleteService` |
| `POST /api/bookings` | `createBooking` | `BookingManager.createBooking` |
| `GET /api/bookings/:bid` | `getBookingById` | `BookingManager.getBookingById` |
| `POST /api/bookings/:bid/services/:sid` | `addServiceToBooking` | `BookingManager.addServiceToBooking` |

En `addServiceToBooking`, el controller consulta primero al `BookingManager` y al `ServiceManager` para verificar que existan la reserva y el servicio, y así poder informar cuál de los dos falta.

## Recurso: services

Cada servicio tiene la siguiente forma:

```json
{
  "id": 1,
  "name": "Mecánica",
  "description": "Servicio de mecánica general",
  "duration": 30,
  "price": 6000,
  "category": "mecanica",
  "available": true
}
```

El `id` se genera automáticamente y no puede modificarse.

## Recurso: bookings

Cada reserva tiene la siguiente forma:

```json
{
  "id": 1,
  "clientName": "Juan",
  "clientEmail": "juan@gmail.com",
  "date": "2026-05-03",
  "time": "18:50",
  "status": "pendiente",
  "services": [
    { "service": 2, "quantity": 1 }
  ]
}
```

El `id` se genera automáticamente. Una reserva siempre nace con `services` vacío: los servicios se agregan después con su endpoint.

Dentro de `services` se guarda únicamente la referencia al servicio (su `id`) y la cantidad, nunca el objeto completo. Si el mismo servicio se agrega dos veces, no se duplica la entrada: se incrementa `quantity`.

## Endpoints de services

Todas las rutas cuelgan de `/api/services`.

| Método | Ruta | Descripción | Respuestas |
|--------|------|-------------|------------|
| GET | `/api/services` | Lista los servicios. Acepta filtros por query params | 200 |
| GET | `/api/services/:id` | Devuelve un servicio por id | 200 / 404 |
| POST | `/api/services` | Crea un servicio con los datos del body | 201 / 400 |
| PUT | `/api/services/:id` | Actualiza un servicio existente | 200 / 404 |
| DELETE | `/api/services/:id` | Da de baja un servicio (baja lógica, ver nota al inicio) | 200 / 404 |

Ante un error inesperado, todos los endpoints responden `500`.

### GET /api/services

Devuelve el listado completo:

```
GET http://localhost:8080/api/services
```

Acepta filtros opcionales por query params, que pueden combinarse:

```
GET http://localhost:8080/api/services?category=mecanica
GET http://localhost:8080/api/services?available=true
GET http://localhost:8080/api/services?category=mecanica&available=true
```

### GET /api/services/:id

```
GET http://localhost:8080/api/services/1
```

Devuelve el servicio con ese id, o `404` si no existe.

### POST /api/services

Crea un servicio. El `id` no se envía: lo genera el sistema.

```
POST http://localhost:8080/api/services
Content-Type: application/json

{
  "name": "Plomería",
  "description": "Servicio de plomería general",
  "duration": 60,
  "price": 8000,
  "category": "plomeria",
  "available": true
}
```

Todos los campos son obligatorios. Si falta alguno, responde `400`.

### PUT /api/services/:id

Actualiza los campos enviados en el body. El `id` se conserva aunque se intente modificar.

```
PUT http://localhost:8080/api/services/1
Content-Type: application/json

{
  "price": 7500
}
```

Responde `404` si el servicio no existe.

### DELETE /api/services/:id

```
DELETE http://localhost:8080/api/services/1
```

Realiza una **baja lógica** sobre el campo `available`, según lo indicado por el profesor en clase. El servicio **no se elimina del archivo**: se marca con `available: false` y sigue siendo consultable por su id.

Devuelve el servicio dado de baja:

```json
{
  "id": 1,
  "name": "Mecánica",
  "description": "Servicio de mecanica general",
  "duration": 30,
  "price": 9500,
  "category": "mecanica",
  "available": false
}
```

Responde `404` si el servicio no existe.

Al consultarlo después con `GET /api/services/1` sigue respondiendo `200` con `available: false`. Ese es el comportamiento correcto de una baja lógica, no una falla del endpoint.

## Endpoints de bookings

Todas las rutas cuelgan de `/api/bookings`.

| Método | Ruta | Descripción | Respuestas |
|--------|------|-------------|------------|
| POST | `/api/bookings` | Crea una reserva | 201 / 400 |
| GET | `/api/bookings/:bid` | Devuelve una reserva por id | 200 / 404 |
| POST | `/api/bookings/:bid/services/:sid` | Agrega un servicio a una reserva | 200 / 404 |

### POST /api/bookings

Crea una reserva. El `id` lo genera el sistema y `services` arranca vacío.

```
POST http://localhost:8080/api/bookings
Content-Type: application/json

{
  "clientName": "Juan",
  "clientEmail": "juan@gmail.com",
  "date": "2026-05-03",
  "time": "18:50",
  "status": "pendiente"
}
```

Todos los campos son obligatorios. Si falta alguno, responde `400`.

### GET /api/bookings/:bid

```
GET http://localhost:8080/api/bookings/1
```

Devuelve la reserva con ese id, o `404` si no existe.

### POST /api/bookings/:bid/services/:sid

Agrega el servicio `sid` a la reserva `bid`. No lleva body: los dos identificadores viajan en la URL.

```
POST http://localhost:8080/api/bookings/1/services/2
```

Valida que existan tanto la reserva como el servicio; si falta cualquiera de los dos, responde `404`. Si el servicio ya estaba en la reserva, incrementa su `quantity` en lugar de agregarlo de nuevo.

Devuelve la reserva completa actualizada:

```json
{
  "id": 1,
  "clientName": "Juan",
  "clientEmail": "juan@gmail.com",
  "date": "2026-05-03",
  "time": "18:50",
  "status": "pendiente",
  "services": [
    { "service": 2, "quantity": 2 }
  ]
}
```

## Cómo probar

Los `GET` pueden probarse directamente desde el navegador.

Para `POST`, `PUT` y `DELETE` se necesita un cliente HTTP como Postman o Thunder Client: se selecciona el método, se ingresa la URL y, en los casos que corresponda, se envía el body en formato JSON.

### Colección de Postman

El repositorio incluye una colección lista para importar en `postman/admServicios.postman_collection.json`, con los casos de prueba de ambos recursos, incluidos los de error.

Para usarla: importar el archivo en Postman, levantar el servidor con `pnpm start` y ejecutar la colección completa con **Run collection**. Cada request valida automáticamente el código de estado y el contenido esperado.

Casos cubiertos:

| Recurso | Caso | Esperado |
|---------|------|----------|
| services | Listar todos | 200 |
| services | Filtrar por category, por available y ambos combinados | 200 |
| services | Consultar por id existente | 200 |
| services | Consultar por id inexistente o no numérico | 404 |
| services | Crear con todos los campos | 201 |
| services | Crear con `price: 0` | 201 |
| services | Crear con un campo faltante | 400 |
| services | Crear sin body | 400 |
| services | Actualizar enviando un `id` distinto | 200, conserva el id original |
| services | Actualizar uno inexistente | 404 |
| services | Dar de baja | 200, queda con `available: false` |
| services | Verificar que el registro sigue en el archivo | 200 |
| services | Dar de baja uno inexistente | 404 |
| bookings | Crear reserva | 201, con `services` vacío |
| bookings | Crear con un campo faltante o sin body | 400 |
| bookings | Consultar por id | 200 |
| bookings | Consultar una inexistente | 404 |
| bookings | Agregar un servicio | 200, `quantity: 1` |
| bookings | Agregar el mismo servicio otra vez | 200, `quantity: 2` sin duplicar |
| bookings | Agregar un segundo servicio distinto | 200, dos entradas |
| bookings | Agregar un servicio inexistente | 404 |
| bookings | Agregar a una reserva inexistente | 404 |
| bookings | Releer la reserva | 200, la relación quedó persistida |
