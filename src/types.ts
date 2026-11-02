export type Role = 'admin' | 'conductor' | 'cliente'

export type View =
  // cliente
  | 'book' | 'dashboard' | 'profile'
  // conductor
  | 'driver' | 'services'
  // admin
  | 'admin' | 'support' | 'fleet' | 'rates'

export interface User {
  id: string
  role: Role
  name: string
  email: string
  phone: string
  /** SHA-256 de `salt:contraseña` (solo demostración: no reemplaza un backend real) */
  passwordHash: string
  salt: string
  created: string
}

export type Mode = 'vehiculo' | 'conductor'
export type Trip = 'ida' | 'vuelta'

export type BookingStatus = 'Pendiente' | 'Confirmada' | 'En curso' | 'Finalizada' | 'Cancelada'

export interface Booking {
  id: string
  created: string
  service: string
  mode: Mode
  date: string
  time: string
  origin: string
  destination: string
  trip: Trip
  wait: number
  km: number
  passengers: number
  name: string
  phone: string
  email: string
  notes: string
  price: number
  status: BookingStatus
  driverId: string
  vehicleId: string
  /** Cliente que creó la solicitud (ausente en reservas anteriores al login) */
  userId?: string
}

export type FleetKind = 'driver' | 'vehicle'

export interface FleetEntry {
  id: string
  name: string
  detail: string
  /** Data URL JPEG comprimido, o '' si no tiene foto */
  photo: string
  kind: FleetKind
  plate?: string
  /** Cuenta de conductor dueña del registro (si lo creó el propio conductor) */
  userId?: string
  phone?: string
  /** Clase de licencia de conducir (conductores) */
  license?: string
  /** Año del vehículo */
  year?: string
}

export interface Fleet {
  drivers: FleetEntry[]
  vehicles: FleetEntry[]
}

export interface RatesConfig {
  vehicleBase: number
  vehicleKm: number
  driverBase: number
  driverKm: number
  wait: number
}

export type TicketStatus = 'Abierto' | 'En revisión' | 'Resuelto'

/** Caso de soporte asociado a un viaje, creado por el cliente o el conductor */
export interface SupportTicket {
  id: string
  created: string
  bookingId: string
  userId: string
  role: Exclude<Role, 'admin'>
  name: string
  phone: string
  category: string
  /** Urgencia indicada por quien reporta */
  urgent: boolean
  message: string
  /** Objeto olvidado/encontrado o estado del vehículo, según la categoría */
  extra: string
  /** Pregunta a la que responde `extra` */
  extraLabel: string
  status: TicketStatus
  /** Respuesta del administrador, visible para quien reportó */
  reply: string
}
