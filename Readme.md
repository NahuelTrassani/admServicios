# Administrador de Servicios - Sistema de Turnos y Reservas

Pre-entrega 1 del curso Programación Backend I (CoderHouse). Implementa una clase `ServiceManager` que gestiona servicios de un sistema de turnos con persistencia en archivo JSON.

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

La app valida las variables al iniciar: si falta `PORT`, se cierra con un mensaje de error.

## Ejecución

```bash
pnpm start        # ejecuta la app
pnpm run dev      # modo desarrollo con reinicio automático
```

## Recurso: services

Cada servicio tiene la forma:

```json
{
  "id": 3,
  "name": "Electrónica",
  "description": "Venta de equipos electrónicos",
  "duration": 30,
  "price": 5000,
  "category": "electronicos",
  "available": true
}
```

Los datos se persisten en `src/data/services.json`.

## Métodos de ServiceManager

```js
const manager = new ServiceManager()

await manager.getServices()                      // devuelve todos los servicios
await manager.getServiceById(1)                  // devuelve el servicio o null
await manager.addService({ name, description, duration, price, category, available })
                                                 // agrega un servicio; el id se genera automáticamente;
                                                 // rechaza servicios con campos faltantes (devuelve null)
await manager.updateService(1, { price: 6000 })  // actualiza campos; el id no puede modificarse
await manager.deleteService(1)                   // elimina el servicio; devuelve null si no existe
```