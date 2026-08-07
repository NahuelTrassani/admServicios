# API REST - Sistema de Turnos y Reservas

Pre-entrega 3 del curso Programación Backend I (CoderHouse).

API REST construida con Express que expone dos recursos: `services` (los servicios que pueden reservarse) y `bookings` (las reservas de los clientes). Cada recurso tiene su propio router (`express.Router()`) y su manager, que encapsula la lógica de acceso a los datos y persiste la información en archivos JSON.

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

## Estructura

```
src/
  config/env.config.js        configuración y validación de variables de entorno
  managers/ServiceManager.js  acceso a los datos de servicios
  managers/BookingManager.js  acceso a los datos de reservas
  routes/services.router.js   rutas del recurso services
  routes/bookings.router.js   rutas del recurso bookings
  data/services.json          persistencia de servicios
  data/bookings.json          persistencia de reservas
  app.js                      configuración de Express
  server.js                   levanta el servidor
```

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
| DELETE | `/api/services/:id` | Da de baja un servicio (baja lógica) | 200 / 404 |

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

Realiza una baja lógica: el servicio no se elimina del archivo, se marca con `available: false`. Devuelve el servicio dado de baja, o `404` si no existe.

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
