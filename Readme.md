# API REST - Sistema de Turnos y Reservas

Pre-entrega 8 del curso Programación Backend I (CoderHouse).

API REST construida con Express que expone tres recursos: `services` (los servicios que pueden reservarse), `bookings` (las reservas de los clientes) y `messages` (mensajes del sistema), con persistencia en **MongoDB Atlas** mediante Mongoose.

Además de la API, el proyecto sirve vistas renderizadas en el servidor con Handlebars y actualiza esas vistas en tiempo real con Socket.io.

Está organizado en cinco capas —router, controller, service, repository y DAO— cada una con una responsabilidad única y sin conocer más que la siguiente.

El listado de servicios se consulta con **filtros, ordenamiento y paginación resueltos en MongoDB**, todo lo que entra por la API se valida con **Zod** en un middleware previo al controller, y las reservas se devuelven con **populate** para resolver la referencia a cada servicio.

## Nota sobre el DELETE de servicios

**El `DELETE /api/services/:sid` realiza una baja lógica, no un borrado físico.** Esta implementación responde a la consigna dada en clase por el profesor.

La baja se registra en el campo `available` del documento: al eliminar un servicio, su `available` pasa a `false`. El registro permanece en la colección y sigue siendo consultable por su id.

Comportamiento esperado al probar el endpoint:

```
DELETE /api/services/:sid   ->  200, devuelve el servicio con "available": false
GET    /api/services/:sid   ->  200, el registro sigue existiendo, ahora con "available": false
```

Que el servicio siga respondiendo después del DELETE **no es un error**: es el resultado de la baja lógica. El servicio queda marcado como no disponible en lugar de desaparecer de la colección.

Motivo de la decisión: preservar la integridad referencial. Las reservas guardan el `ObjectId` del servicio, y un borrado físico dejaría esas reservas apuntando a un documento inexistente. Con la baja lógica se conserva el historial de reservas y el dato sigue siendo consultable.

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
| MONGO_URI | Cadena de conexión a MongoDB Atlas | ver formato abajo |

La app valida las tres variables al iniciar: si falta alguna, el proceso se cierra con un mensaje de error. Lo mismo ocurre si la conexión a la base falla, para evitar que el servidor quede escuchando sin persistencia.

La `MONGO_URI` tiene este formato, reemplazando cada parte entre corchetes por los datos del propio cluster:

```
mongodb+srv://[USUARIO]:[CONTRASEÑA]@[CLUSTER].mongodb.net/[BASE]?appName=[APP]
```

### Cómo obtener la URI de MongoDB Atlas

1. Crear una cuenta en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) y un cluster gratuito (M0)
2. En **Database Access**, crear un usuario de base de datos con contraseña
3. En **Network Access**, habilitar la IP desde la que se va a conectar
4. En el cluster, **Connect → Drivers → Node.js**, copiar la cadena de conexión
5. Reemplazar `<db_password>` por la contraseña real y agregar el nombre de la base antes del `?`

La contraseña no debe contener caracteres que se usan como separadores de URL (`@`, `:`, `/`, `#`, `&`); si los tiene, hay que codificarlos.

## Ejecución

```bash
pnpm start        # ejecuta la app
pnpm run dev      # modo desarrollo con reinicio automático
pnpm test         # corre los tests automatizados
```

El servidor queda escuchando en `http://localhost:8080`.

## Arquitectura en capas

Una petición atraviesa cinco capas antes de llegar a los datos. Cada una tiene una sola responsabilidad y solo conoce a la siguiente:

```
cliente  ->  router  ->  controller  ->  service  ->  repository  ->  DAO  ->  MongoDB
```

Las vistas usan exactamente la misma cadena: `views.controller.js` le pide los datos a los services, igual que los controllers de la API.

### Router

Declara los endpoints y los asocia con la función del controller que los atiende. No contiene lógica: ni validaciones, ni acceso a datos, ni manejo de la respuesta.

```js
// src/routes/services.router.js
router.get("/:id", getServiceById);
router.delete("/:id", deleteService);
```

### Controller

Es el puente con HTTP y la única capa que conoce Express. Lee `req.params`, `req.query` y `req.body`, le pide el trabajo al service y arma la respuesta con `res.status().json()`. No sabe cómo ni dónde se guardan los datos.

```js
// src/controllers/services.controller.js
export const getServiceById = async (req, res) => {
  const serviceId = req.params.id;
  try {
    const service = await servicesService.getServiceById(serviceId);
    if (service) {
      res.status(200).json(service);
    } else {
      res.status(404).json({ error: "Servicio no encontrado" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el servicio" });
  }
};
```

### Service

Concentra las reglas de negocio: qué hace válido a un servicio, qué significa dar de baja, cómo se filtra un listado, qué pasa si un servicio ya está en una reserva. No recibe `req` ni `res`, y devuelve datos o `null`.

```js
// src/services/services.service.js
export const deleteService = async (id) => {
  //dar de baja es marcar como no disponible, no borrar el registro
  return servicesRepository.update(id, { available: false });
};
```

### Repository

Ofrece los métodos de acceso a datos y desacopla al service de la fuente concreta. Recibe su DAO por inyección en el constructor, así que cambiar de origen de datos no lo obliga a cambiar.

```js
// src/repositories/services.repository.js
class ServicesRepository {
  constructor(dao) {
    this.dao = dao;
  }

  async update(id, data) {
    return this.dao.update(id, data);
  }
}

export default new ServicesRepository(servicesDao);
```

### DAO

Consulta y escribe en MongoDB a través de los modelos de Mongoose. Es la única capa que conoce la base, y no contiene ninguna regla de negocio: recibe datos, los guarda, los devuelve.

```js
// src/dao/services.dao.js
async getById(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }
  return Service.findById(id);
}

async update(id, data) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }
  return Service.findByIdAndUpdate(id, data, { returnDocument: "after" });
}
```

La validación con `ObjectId.isValid` corta antes de consultar cuando el id no tiene forma válida. Sin ella, Mongoose lanzaría un error de casteo y la API respondería 500 en vez de 404.

### El idioma cambia al bajar de capa

Arriba se habla en términos del negocio; abajo, en términos de datos. Por eso los nombres no coinciden, y eso es deliberado:

| Operación del negocio | Se resuelve abajo como |
|---|---|
| `deleteService` — dar de baja un servicio | `update` con `available: false` |
| `addServiceToBooking` — agregar un servicio a una reserva | `update` del array `services` |
| `deleteMessage` — borrar una nota | `delete` real, sin baja lógica |

En los dos casos, la decisión de *qué significa* la operación vive en el service. El DAO solo ejecuta una escritura: no sabe qué es una baja lógica ni qué es una cantidad.

### Por qué services usa baja lógica y messages no

Los dos recursos exponen un `DELETE`, pero se resuelven distinto a propósito:

| Recurso | Qué hace el DELETE | Por qué |
|---|---|---|
| `services` | marca `available: false` | Las reservas guardan el `ObjectId` del servicio. Un borrado físico dejaría esas reservas apuntando a un documento que ya no existe |
| `messages` | borra el documento | Ningún documento referencia un mensaje, así que no hay integridad que preservar |

Es la misma operación desde afuera y dos decisiones distintas adentro, cada una atada a las relaciones del dato.


### Qué gana el proyecto con esto

La migración de archivos JSON a MongoDB quedó contenida en la capa DAO. Los routers, controllers y repositories no se tocaron, y del service solo cambió la comparación de identificadores, porque los ids pasaron de números a `ObjectId`. La API responde igual desde afuera.

## Estructura

```
src/
  config/
    env.config.js               lectura y validación de variables de entorno
    db.config.js                conexión a MongoDB Atlas
  routes/
    services.router.js          endpoints de services
    bookings.router.js          endpoints de bookings
    messages.router.js          endpoints de messages
    views.router.js             rutas de las vistas
  validations/
    service.validation.js       schemas de Zod de services
    booking.validation.js       schemas de Zod de bookings y de sus params
    message.validation.js       schemas de Zod de messages
  middlewares/
    validate.js                 corre un schema contra body, params o query
  controllers/
    services.controller.js      request/response de services
    bookings.controller.js      request/response de bookings
    messages.controller.js      request/response de messages
    views.controller.js         render de las vistas
  services/
    services.service.js         reglas de negocio de services
    bookings.service.js         reglas de negocio de bookings
    messages.service.js         reglas de negocio de messages
  repositories/
    services.repository.js      acceso a datos de services
    bookings.repository.js      acceso a datos de bookings
    messages.repository.js      acceso a datos de messages
  dao/
    services.dao.js             consultas a la colección services
    bookings.dao.js             consultas a la colección bookings
    messages.dao.js             consultas a la colección messages
  models/
    service.model.js            schema y model de servicios
    booking.model.js            schema y model de reservas
    message.model.js            schema y model de mensajes
  views/
    layouts/main.handlebars     estructura común de todas las páginas
    services.handlebars         listado de servicios
    availability.handlebars     reservas y disponibilidad
    activity.handlebars         actividad del sistema y notas
  sockets/
    index.js                    handlers de Socket.io
  utils/
    errors.js                   distingue errores de validación de fallas reales
  app.js                        configuración de Express, Handlebars y routers
  server.js                     levanta el servidor HTTP y Socket.io
public/
  css/styles.css                estilos de las vistas
  js/socket.js                  cliente de Socket.io
tests/                          tests con Vitest
postman/                        colección de pruebas de la API
```

### Correspondencia entre capas

| Endpoint | Controller y Service | Repository y DAO |
|---|---|---|
| `GET /api/services` | `getServices` / `searchServices` | `search` |
| `GET /api/services/:sid` | `getServiceById` | `getById` |
| `POST /api/services` | `createService` | `create` |
| `PUT /api/services/:sid` | `updateService` | `update` |
| `DELETE /api/services/:sid` | `deleteService` | `update` |
| `POST /api/bookings` | `createBooking` | `create` |
| `GET /api/bookings/:bid` | `getBookingById` / `getBookingWithServices` | `getByIdPopulated` |
| `POST /api/bookings/:bid/services/:sid` | `addServiceToBooking` | `getById` + `update` |
| `GET /api/messages` | `getMessages` | `getAll` |
| `PUT /api/messages/:mid` | `updateMessage` | `update` |
| `DELETE /api/messages/:mid` | `deleteMessage` | `delete` |
| `GET /views/services` | `renderServices` / `searchServices` | `search` |
| `GET /views/availability` | `renderAvailability` / `countServices` | `getAllPopulated` + `count` |
| `GET /views/activity` | `renderActivity` | `getAll` |
| `GET /api/messages/:mid` | `getMessageById` | `getById` |
| `POST /api/messages` | `createMessage` | `create` |

Las dos últimas filas muestran por qué los nombres no coinciden entre capas: `deleteService` y `addServiceToBooking` son operaciones del negocio que abajo se resuelven con un `update`. Por eso el DAO no tiene método `delete`.

En `addServiceToBooking`, el controller consulta por separado la reserva y el servicio antes de llamar al service, para poder responder cuál de los dos falta. El service vuelve a validar ambos, de modo que no dependa de que su llamador lo haga.

## Validaciones

Las validaciones están repartidas en tres capas, cada una con una responsabilidad distinta y ninguna de las tres reemplaza a la otra.

| Capa | Qué controla | Con qué |
|---|---|---|
| Middleware | la **forma** de lo que entra: tipos, formatos, rangos, campos de más | Zod |
| Service | las **reglas del negocio**: qué significa dar de baja, cuándo incrementar una cantidad | código propio |
| Modelo | la **integridad de lo guardado**: última línea si algo escribe sin pasar por la API | Mongoose |

### Por qué un middleware y no una validación dentro del controller

El controller no tiene que saber si el `price` vino como número o como texto. Cuando llega a ejecutarse, el dato ya está validado y convertido. Si no lo estaba, el controller nunca se ejecuta: el middleware cortó la cadena con un `400`.

```js
// src/routes/services.router.js
router.get("/", validateQuery(listServicesQuerySchema), getServices);
router.post("/", validateBody(createServiceSchema), createService);
router.put("/:id", validateBody(updateServiceSchema), updateService);
```

```js
// src/middlewares/validate.js
const validar = (origen) => (esquema) => (req, res, next) => {
  const resultado = esquema.safeParse(req[origen]);

  if (!resultado.success) {
    return res.status(400).json({
      error: "Datos inválidos",
      detalles: traducirErrores(resultado.error),
    });
  }

  req[origen] = resultado.data;
  next();
};
```

`safeParse` no lanza: devuelve `{ success, data | error }`. Eso permite decidir qué responder en vez de depender de un `try/catch`.

El `req[origen] = resultado.data` es la parte que más cambia el resto del código: lo que sigue recibe el dato **ya convertido y con los defaults puestos**. Por eso el controller de listado no reconvierte nada.

### El query no se pisa, se deja en `req.consulta`

En Express 5 `req.query` es de solo lectura, así que el resultado del parseo va a una propiedad aparte:

```js
export const validateQuery = (esquema) => (req, res, next) => {
  const resultado = esquema.safeParse(req.query);
  if (!resultado.success) { /* 400 */ }

  //el resultado va a req.consulta y no pisa req.query, para no alterar lo que mando el cliente
  req.consulta = resultado.data;
  next();
};
```

### Qué valida cada schema

Los schemas están en `src/validations/`, uno por recurso.

| Campo | Regla |
|---|---|
| `service.name` | texto, 1 a 80 caracteres, se recortan los espacios |
| `service.description` | texto, 1 a 300 caracteres |
| `service.duration` | entero, mínimo 1 minuto |
| `service.price` | número, mínimo 0 (un servicio gratuito es válido) |
| `service.category` | texto, 1 a 40 caracteres |
| `service.available` | booleano, obligatorio |
| `booking.clientEmail` | formato de email |
| `booking.date` | formato `AAAA-MM-DD` **y** que el día exista en el calendario |
| `booking.time` | formato `HH:MM` en 24 horas |
| `booking.status` | solo `pendiente`, `confirmada` o `cancelada`; por defecto `pendiente` |
| `:bid` y `:sid` | 24 caracteres hexadecimales (formato de un ObjectId) |
| `message.user` | texto, 1 a 40 caracteres |
| `message.message` | texto, 1 a 500 caracteres |

**Tres decisiones que no son obvias:**

`.strict()` en todos los schemas. Un campo que no está declarado no se ignora: se rechaza. Mandar `{ "nombre": "X" }` en vez de `{ "name": "X" }` devuelve un error que dice qué pasó, en vez de guardar un servicio sin nombre.

`.partial()` más un `.refine()` en los updates. El PUT acepta mandar un solo campo, pero no acepta un body vacío:

```js
export const updateServiceSchema = createServiceSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    error: "Hay que enviar al menos un campo para actualizar",
  });
```

**La fecha se compara contra sí misma.** `Date.parse("2026-02-31")` no falla: JavaScript corre esa fecha al 3 de marzo y devuelve un número válido. Una validación que solo mire si el parseo funciona deja pasar días que no existen. La única forma de detectarlo es reconstruir la fecha y ver si coincide con lo que se escribió:

```js
.refine((valor) => {
  const [anio, mes, dia] = valor.split("-").map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  return (
    fecha.getUTCFullYear() === anio &&
    fecha.getUTCMonth() === mes - 1 &&
    fecha.getUTCDate() === dia
  );
}, { error: "La fecha no existe en el calendario" })
```

### Cómo se ve un error de validación

La respuesta dice **qué campo** está mal y **por qué**, no solo que algo falló:

```json
{
  "error": "Datos inválidos",
  "detalles": [
    { "campo": "price", "mensaje": "El precio no puede ser negativo" },
    { "campo": "duration", "mensaje": "La duración debe ser de al menos 1 minuto" }
  ]
}
```

Vienen **todos** los errores juntos, no el primero: el cliente corrige de una sola vez.

La traducción de la estructura de Zod a esa forma es una función sola:

```js
const traducirErrores = (error) =>
  error.issues.map((issue) => ({
    campo: issue.path.join(".") || "(cuerpo)",
    mensaje: issue.message,
  }));
```

### Por qué el modelo sigue validando

Con el middleware adelante, ningún dato inválido debería llegar al modelo. Las reglas de Mongoose quedan igual porque cubren lo que entra **sin pasar por la API**: un seed, una corrección manual, un script. Son dos redes a distinta altura, no la misma regla escrita dos veces.

Si aun así el modelo rechaza algo, el service distingue el error del cliente del error del servidor:

```js
// src/utils/errors.js
export const esErrorDeValidacion = (error) =>
  error?.name === "ValidationError" || error?.name === "CastError";
```

```js
try {
  return await servicesRepository.create(data);
} catch (error) {
  //el schema rechazo el dato: es culpa del cliente, no del servidor
  if (esErrorDeValidacion(error)) {
    return null;
  }
  throw error;
}
```

Un dato inválido devuelve `null`, que el controller traduce a `400`. Cualquier otro error —una caída de la base, por ejemplo— se propaga y sigue respondiendo `500`, que en ese caso sí corresponde.

## Recurso: services

Cada servicio tiene la siguiente forma:

```json
{
  "_id": "68b1f2a4c9e77d3b1a4f0012",
  "name": "Mecánica",
  "description": "Servicio de mecánica general",
  "duration": 30,
  "price": 6000,
  "category": "mecanica",
  "available": true
}
```

El `_id` es un `ObjectId` que genera MongoDB al crear el documento. No se envía en el body ni puede modificarse.

## Recurso: bookings

Cada reserva tiene la siguiente forma:

```json
{
  "_id": "68b1f2a4c9e77d3b1a4f0099",
  "clientName": "Juan",
  "clientEmail": "juan@gmail.com",
  "date": "2026-05-03T00:00:00.000Z",
  "time": "18:50",
  "status": "pendiente",
  "services": [
    { "service": "68b1f2a4c9e77d3b1a4f0012", "quantity": 1 }
  ]
}
```

Una reserva siempre nace con `services` vacío: los servicios se agregan después con su endpoint.

Dentro de `services` se guarda únicamente el `ObjectId` del servicio y la cantidad, nunca el documento completo. El schema lo declara con `ref: "Service"`, lo que permite resolver la referencia con `populate` cuando haga falta traer los datos del servicio.

Si el mismo servicio se agrega dos veces, no se duplica la entrada: se incrementa `quantity`.

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

Devuelve el listado paginado:

```
GET http://localhost:8080/api/services
```

```json
{
  "services": [ { "_id": "68b1...", "name": "Cambio de aceite", "price": 12000 } ],
  "total": 42,
  "page": 1,
  "limit": 10,
  "totalPages": 5,
  "hasPrevPage": false,
  "hasNextPage": true,
  "prevPage": null,
  "nextPage": 2
}
```

#### Query params

| Param | Valores | Default | Qué hace |
|---|---|---|---|
| `category` | texto | — | filtra por categoría exacta |
| `available` | `true` / `false` | — | filtra por disponibilidad |
| `page` | entero ≥ 1 | `1` | número de página |
| `limit` | entero 1 a 100 | `10` | resultados por página |
| `sortBy` | `name`, `price`, `duration`, `category`, `createdAt` | `name` | campo de ordenamiento |
| `order` | `asc` / `desc` | `asc` | sentido del orden |

Todos son opcionales y se combinan entre sí:

```
GET http://localhost:8080/api/services?category=mecanica
GET http://localhost:8080/api/services?available=true&page=2&limit=5
GET http://localhost:8080/api/services?sortBy=price&order=desc
GET http://localhost:8080/api/services?category=mecanica&available=true&sortBy=price&order=desc&page=1&limit=20
```

Un parámetro fuera de rango o que no está en la lista devuelve `400` con el detalle:

```
GET http://localhost:8080/api/services?limit=500
```

```json
{
  "error": "Parámetros de consulta inválidos",
  "detalles": [
    { "campo": "limit", "mensaje": "El límite no puede superar los 100 resultados por página" }
  ]
}
```

El tope de `limit` no es decorativo: sin él, un `?limit=999999` obliga a la base a devolver el catálogo entero en una sola respuesta.

#### Quién hace el trabajo

El filtrado, el ordenamiento y el corte los resuelve MongoDB. Nunca se traen todos los documentos para descartarlos en memoria:

```js
// src/dao/services.dao.js
const orden = { [sortBy]: order === "desc" ? -1 : 1 };
const salteo = (page - 1) * limit;

//las dos consultas van en paralelo: el total no depende del listado
const [items, total] = await Promise.all([
  Service.find(filtro).sort(orden).skip(salteo).limit(limit),
  Service.countDocuments(filtro),
]);
```

El service arma los metadatos a partir de ese total, y el controller solo responde:

```js
export const getServices = async (req, res) => {
  //req.consulta viene del middleware con los tipos convertidos y los defaults puestos
  const resultado = await servicesService.searchServices(req.consulta);
  res.status(200).json(resultado);
};
```

### GET /api/services/:id

```
GET http://localhost:8080/api/services/68b1f2a4c9e77d3b1a4f0012
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
PUT http://localhost:8080/api/services/68b1f2a4c9e77d3b1a4f0012
Content-Type: application/json

{
  "price": 7500
}
```

Responde `404` si el servicio no existe.

### DELETE /api/services/:id

```
DELETE http://localhost:8080/api/services/68b1f2a4c9e77d3b1a4f0012
```

Realiza una **baja lógica** sobre el campo `available`, según lo indicado por el profesor en clase. El servicio **no se elimina del archivo**: se marca con `available: false` y sigue siendo consultable por su id.

Devuelve el servicio dado de baja:

```json
{
  "_id": "68b1f2a4c9e77d3b1a4f0012",
  "name": "Mecánica",
  "description": "Servicio de mecanica general",
  "duration": 30,
  "price": 9500,
  "category": "mecanica",
  "available": false
}
```

Responde `404` si el servicio no existe.

Al consultarlo después con `GET /api/services/:sid` sigue respondiendo `200` con `available: false`. Ese es el comportamiento correcto de una baja lógica, no una falla del endpoint.

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
GET http://localhost:8080/api/bookings/68b1f2a4c9e77d3b1a4f0099
```

Devuelve la reserva con ese id, o `404` si no existe. Si el id no tiene formato de ObjectId devuelve `400`: la validación corta antes de consultar la base.

La respuesta viene con **populate**: donde la base guarda un `ObjectId`, la API devuelve el documento completo del servicio.

Lo que está guardado en Mongo:

```json
{ "services": [ { "service": "68b1f2a4c9e77d3b1a4f0012", "quantity": 2 } ] }
```

Lo que devuelve la API:

```json
{
  "services": [
    {
      "service": {
        "_id": "68b1f2a4c9e77d3b1a4f0012",
        "name": "Cambio de aceite",
        "price": 12000,
        "duration": 45,
        "category": "mecanica"
      },
      "quantity": 2
    }
  ]
}
```

La base sigue guardando la referencia: `populate` resuelve la relación al momento de leer, no duplica el dato.

```js
// src/dao/bookings.dao.js
async getByIdPopulated(id) {
  return Booking.findById(id).populate("services.service");
}
```

Sin populate, un cliente que quiera mostrar el nombre de cada servicio tiene que hacer un pedido más por cada id. Con populate resuelve la pantalla con una sola llamada.

### POST /api/bookings/:bid/services/:sid

Agrega el servicio `sid` a la reserva `bid`. No lleva body: los dos identificadores viajan en la URL.

```
POST http://localhost:8080/api/bookings/68b1f2a4c9e77d3b1a4f0099/services/68b1f2a4c9e77d3b1a4f0012
```

Valida que existan tanto la reserva como el servicio; si falta cualquiera de los dos, responde `404`. Si el servicio ya estaba en la reserva, incrementa su `quantity` en lugar de agregarlo de nuevo.

Devuelve la reserva completa actualizada:

```json
{
  "_id": "68b1f2a4c9e77d3b1a4f0099",
  "clientName": "Juan",
  "clientEmail": "juan@gmail.com",
  "date": "2026-05-03T00:00:00.000Z",
  "time": "18:50",
  "status": "pendiente",
  "services": [
    { "service": "68b1f2a4c9e77d3b1a4f0012", "quantity": 2 }
  ]
}
```

## Recurso: messages

Cada mensaje tiene la siguiente forma:

```json
{
  "_id": "68b1f2a4c9e77d3b1a4f0077",
  "user": "juan@mail.com",
  "message": "Consulta por disponibilidad",
  "createdAt": "2026-09-06T14:22:10.512Z",
  "updatedAt": "2026-09-06T14:22:10.512Z"
}
```

Los campos `createdAt` y `updatedAt` los agrega Mongoose automáticamente con la opción `timestamps`.

## Endpoints de messages

Todas las rutas cuelgan de `/api/messages`.

| Método | Ruta | Descripción | Respuestas |
|--------|------|-------------|------------|
| GET | `/api/messages` | Lista los mensajes | 200 |
| GET | `/api/messages/:mid` | Devuelve un mensaje por id | 200 / 404 |
| POST | `/api/messages` | Crea un mensaje | 201 / 400 |
| PUT | `/api/messages/:mid` | Edita un mensaje | 200 / 404 |
| DELETE | `/api/messages/:mid` | Elimina un mensaje | 200 / 404 |

### POST /api/messages

```
POST http://localhost:8080/api/messages
Content-Type: application/json

{
  "user": "juan@mail.com",
  "message": "Consulta por disponibilidad"
}
```

Los dos campos son obligatorios y el mensaje no puede superar los 500 caracteres. Si falta alguno o se excede el límite, responde `400`.

## Vistas

Además de la API, el proyecto renderiza dos páginas en el servidor con **Handlebars**.

| Ruta | Qué muestra |
|---|---|
| `/views/services` | Listado de servicios con nombre, descripción, duración, precio, categoría y disponibilidad |
| `/views/availability` | Reservas con sus servicios asociados, y el total de servicios disponibles |
| `/views/activity` | Novedades del sistema y notas del equipo, con un formulario para publicar |

Las dos toman los datos de MongoDB pasando por las mismas capas que la API: el controller de vistas llama a los services, no consulta la base por su cuenta.

```js
// src/controllers/views.controller.js
const criterios = listServicesQuerySchema.parse({ limit: "50", ...req.query });
const resultado = await servicesService.searchServices(criterios);
res.render("services", {
  title: "Servicios",
  services: resultado.services.map((s) => s.toObject()),
  paginacion: { total: resultado.total, page: resultado.page, totalPages: resultado.totalPages },
});
```

El `.toObject()` es necesario porque Handlebars no puede leer documentos de Mongoose directamente: hay que convertirlos a objetos planos o los campos salen vacíos.

### El populate en la vista de disponibilidad

Cada reserva guarda solo el `ObjectId` del servicio, pero la vista muestra su nombre. Esa referencia se resuelve con `populate`:

```js
// src/dao/bookings.dao.js
async getAllPopulated() {
  return Booking.find().populate("services.service");
}
```

Va en un método **aparte** del listado común a propósito: si estuviera dentro, la API REST empezaría a devolver el servicio completo dentro de cada reserva y se rompería el requisito de guardar solo la referencia.

## Tiempo real con Socket.io

Cuando alguien modifica algo por la API, las vistas abiertas se actualizan **sin recargar la página**.

### Cómo está montado

Socket.io necesita el servidor HTTP, no alcanza con la app de Express. Por eso `server.js` lo crea explícitamente:

```js
const httpServer = createServer(app);
const io = new Server(httpServer);

//se guarda en la app para que los controllers puedan emitir con req.app.get("io")
app.set("io", io);

httpServer.listen(config.port, ...);
```

Guardar la instancia en la app permite emitir desde los controllers sin que las capas internas conozcan Socket.io: el service y el DAO siguen sin saber que existe.

### Los eventos

Cada evento responde a una acción concreta del sistema, no a la conexión de un usuario:

| Acción | Evento emitido | Efecto en la vista |
|---|---|---|
| `POST /api/services` | `servicioCreado` | agrega la fila al listado |
| `PUT /api/services/:sid` | `servicioActualizado` | reemplaza la fila |
| `DELETE /api/services/:sid` | `servicioActualizado` | la fila pasa a "no disponible" |
| `POST /api/bookings` | `reservaCreada` | actualiza la vista de disponibilidad |
| `POST /api/bookings/:bid/services/:sid` | `reservaActualizada` | actualiza la vista de disponibilidad |
| Cualquiera de las anteriores | `actividadRegistrada` | suma la novedad al panel de actividad |

En el controller, después de que la operación salió bien:

```js
req.app.get("io")?.emit("servicioCreado", newService);
```

Y en el cliente:

```js
// public/js/socket.js
socket.on("servicioCreado", (servicio) => {
  lista.appendChild(filaDeServicio(servicio));
});
```

### Del cliente al servidor

Los eventos anteriores viajan en una sola dirección: el servidor avisa, el navegador escucha. El panel de actividad usa la dirección contraria — el navegador manda una nota, y el servidor la recibe, la guarda y la difunde a todos los paneles abiertos.

```js
// public/js/socket.js — el navegador envía
socket.emit("nuevaNota", { user, message });
```

```js
// src/sockets/index.js — el servidor recibe, valida y difunde
socket.on("nuevaNota", async ({ user, message }) => {
  const nota = await messagesService.createMessage({ user, message });

  if (!nota) {
    //el dato no paso la validacion: se le avisa solo a quien la envio
    socket.emit("notaRechazada", {
      error: "El usuario y el mensaje son obligatorios",
    });
    return;
  }

  io.emit("actividadRegistrada", nota);
});
```

La diferencia entre `socket.emit` e `io.emit` importa: el primero le responde solo a quien envió el mensaje, el segundo le habla a todos los clientes conectados.

Dos decisiones de esa parte. Los handlers viven en `src/sockets/index.js` y no en `server.js`, que se queda únicamente con levantar el servidor. Y el handler usa el service de messages, la misma capa que usa la API: la nota se persiste en MongoDB atravesando la arquitectura de siempre, no por un atajo.

### Cómo verificarlo


1. Levantar el servidor con `pnpm start`
2. Abrir `http://localhost:8080/views/services` en el navegador
3. Sin cerrar esa pestaña, crear un servicio desde Postman o con curl:

```bash
curl -X POST http://localhost:8080/api/services   -H "Content-Type: application/json"   -d '{"name":"Cerrajeria","description":"Apertura de cerraduras","duration":45,"price":21000,"category":"cerrajeria","available":true}'
```

La fila nueva aparece en la tabla y el contador sube, sin tocar el navegador. Lo mismo al dar de baja un servicio: la fila cambia a "no disponible" en el momento.

Para probar la dirección contraria, abrir `http://localhost:8080/views/activity`, escribir una nota y publicarla: se guarda en la colección `messages` y aparece en todos los paneles abiertos. Ahí también se registran solas las novedades del sistema, como la creación de un servicio o de una reserva.

## Cómo probar

Los `GET` pueden probarse directamente desde el navegador.

Para `POST`, `PUT` y `DELETE` se necesita un cliente HTTP como Postman o Thunder Client: se selecciona el método, se ingresa la URL y, en los casos que corresponda, se envía el body en formato JSON.

### Colección de Postman

El repositorio incluye una colección lista para importar en `postman/admServicios.postman_collection.json`, con los casos de prueba de ambos recursos, incluidos los de error.

Para usarla: importar el archivo en Postman, levantar el servidor con `pnpm start` y ejecutar la colección completa con **Run collection**. Cada request valida automáticamente el código de estado y el contenido esperado.

También se puede correr desde la terminal, sin abrir Postman:

```bash
npx newman run postman/admServicios.postman_collection.json --env-var baseUrl=http://localhost:8080
```

Son 65 requests con 119 validaciones.

Como los identificadores son `ObjectId` generados por MongoDB, la colección no usa valores fijos: los primeros requests crean los documentos y guardan sus `_id` en variables que reutilizan los siguientes. Por eso conviene ejecutarla completa y en orden.

Casos cubiertos:

| Recurso | Caso | Esperado |
|---------|------|----------|
| services | Listar todos | 200, con el listado y los metadatos de paginación |
| services | Filtrar por category, por available y ambos combinados | 200 |
| services | Paginar con `page` y `limit` | 200, `prevPage` y `totalPages` coherentes |
| services | Ordenar por precio descendente y por nombre ascendente | 200, en el orden pedido |
| services | Pedir una página fuera de rango | 200 con el listado vacío, no un error |
| services | `limit` por encima del máximo | 400, indicando el campo `limit` |
| services | `page` en cero o que no es número | 400 |
| services | `sortBy` fuera de la lista permitida | 400 |
| services | Un query param que no existe | 400 |
| services | Consultar por id existente | 200 |
| services | Consultar por id inexistente | 404 |
| services | Consultar con un id que no es un ObjectId válido | 400, corta antes de la base |
| messages | Consultar con un id mal formado | 400 |
| services | Crear con todos los campos | 201 |
| services | Crear con `price: 0` | 201 |
| services | Crear con un campo faltante | 400, con el campo y el motivo |
| services | Crear con precio negativo o duración cero | 400 |
| services | Crear mandando un número como texto | 400 |
| services | Crear con un campo que no está en el schema | 400, no se ignora |
| services | Actualizar con el body vacío | 400 |
| services | Crear sin body | 400 |
| services | Actualizar | 200, devuelve el documento ya actualizado |
| services | Actualizar uno inexistente | 404 |
| services | Dar de baja | 200, queda con `available: false` |
| services | Verificar que el documento sigue en la colección | 200 |
| messages | Crear, consultar, editar y eliminar | 201 / 200 / 404 |
| messages | Verificar que el borrado es físico | 404 tras el DELETE |
| vistas | Las tres rutas de `/views` | 200 con HTML y datos reales |
| vistas | Archivos estáticos y cliente de Socket.io | 200 |
| services | Dar de baja uno inexistente | 404 |
| bookings | Crear reserva | 201, con `services` vacío |
| bookings | Crear con un campo faltante o sin body | 400 |
| bookings | Crear con una fecha que no existe en el calendario | 400 |
| bookings | Crear con un email, una hora o un estado inválidos | 400 |
| bookings | Consultar con un id que no es un ObjectId | 400, corta antes de la base |
| bookings | Agregar un servicio con un id mal formado | 400, indicando `sid` |
| bookings | Consultar por id | 200 |
| bookings | Consultar una inexistente | 404 |
| bookings | Agregar un servicio | 200, `quantity: 1`, guarda solo la referencia |
| bookings | Agregar el mismo servicio otra vez | 200, `quantity: 2` sin duplicar |
| bookings | Agregar un segundo servicio distinto | 200, dos entradas |
| bookings | Agregar un servicio inexistente | 404 |
| bookings | Agregar a una reserva inexistente | 404 |
| bookings | Releer la reserva | 200, la relación quedó persistida en MongoDB |
| bookings | Verificar el populate | el `service` viene como documento completo, no como id |

## Tests automatizados

El proyecto incluye tests con [Vitest](https://vitest.dev/) que corren sin levantar el servidor ni conectarse a MongoDB.

```bash
pnpm test          # corre los tests una vez
pnpm run test:watch  # los deja corriendo y reejecuta al guardar
```

Los archivos están en `tests/`:

| Archivo | Qué prueba |
|---|---|
| `services.service.test.js` | metadatos de paginación, validaciones de creación, baja lógica |
| `bookings.service.test.js` | creación, y la regla de incrementar `quantity` sin duplicar |
| `messages.service.test.js` | creación, consulta, edición y borrado de mensajes |
| `models.test.js` | las validaciones de los tres schemas de Mongoose |
| `validations.test.js` | los schemas de Zod: qué aceptan y qué rechazan |
| `validate.middleware.test.js` | que el middleware corte con `400` y no llame al controller |
| `services.controller.test.js` | códigos HTTP y emisión de eventos |
| `views.controller.test.js` | render de las vistas y conversión de documentos |
| `sockets.test.js` | recepción de notas, validación y difusión |

**Cómo se prueban los services sin tocar la base.** El repository se reemplaza por un doble que devuelve lo que cada test necesita, así el service se prueba aislado:

```js
vi.mock("../src/repositories/services.repository.js", () => ({
  default: { search: vi.fn(), count: vi.fn(), create: vi.fn(), update: vi.fn() },
}));

it("da de baja marcando available en false, no borra el documento", async () => {
  servicesRepository.update.mockResolvedValue({ available: false });
  await servicesService.deleteService("abc123");
  expect(servicesRepository.update).toHaveBeenCalledWith("abc123", {
    available: false,
  });
});
```

**Cómo se prueban los modelos.** Con `validate()`, que corre las reglas del schema sobre un documento en memoria:

```js
it("rechaza un estado fuera del enum", () =>
  falla(new Booking({ ...valido, status: "banana" }), "status"));
```
