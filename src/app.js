import ServiceManager from './managers/ServiceManager.js'
import config from './config/env.config.js'

console.log(`App ejecutando en modo ${config.nodeEnv} - puerto ${config.port}`)

const manager = new ServiceManager()
const services = await manager.getServices()
console.log(services)

const nuevo = await manager.addService({
    name: "Electrónica",
    description: "venta de equipos electrónicos",
    duration: 60,
    price: 30000,
    category: "electronicos",
    available: true
})
