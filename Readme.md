# API REST de Servicios - Sistema de Turnos y Reservas

Pre-entrega 2 del curso Programación Backend I (CoderHouse).

API REST construida con Express que expone el recurso `services` del sistema de turnos y reservas. Las rutas se organizan en un router propio (`express.Router()`) y la lógica de datos queda encapsulada en la clase `ServiceManager`, que persiste la información en un archivo JSON.

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
  managers/ServiceManager.js  lógica de acceso a los datos
  routes/services.router.js   rutas del recurso services
  data/services.json          persistencia
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

## Endpoints

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

## Cómo probar

Los `GET` pueden probarse directamente desde el navegador.

Para `POST`, `PUT` y `DELETE` se necesita un cliente HTTP como Thunder Client (extensión de VS Code) o Postman: se selecciona el método, se ingresa la URL y, en los casos que corresponda, se envía el body en formato JSON.
