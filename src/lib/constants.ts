import type { BookingStatus, Mode, RatesConfig, TicketStatus } from '../types'

export const SERVICE_TYPES: ReadonlyArray<readonly [emoji: string, label: string]> = [
  ['🩺', 'Horas médicas'],
  ['🏥', 'Centros médicos'],
  ['💍', 'Matrimonios'],
  ['🎉', 'Fiestas y eventos'],
  ['🎓', 'Graduaciones'],
  ['🍼', 'Bautizos'],
  ['✈️', 'Aeropuerto'],
  ['💼', 'Viajes ejecutivos'],
  ['👴', 'Adultos mayores'],
  ['🚘', 'Conductor privado'],
  ['🗓️', 'Trámites y diligencias'],
  ['✨', 'Otro servicio'],
]

export const MODE_OPTIONS: ReadonlyArray<{ value: Mode; emoji: string; title: string; desc: string }> = [
  {
    value: 'vehiculo',
    emoji: '🚘',
    title: 'Viaje con conductor',
    desc: 'Te recogemos en nuestro vehículo, con conductor incluido.',
  },
  {
    value: 'conductor',
    emoji: '🔑',
    title: 'Chofer para mi auto',
    desc: 'Un conductor va a tu ubicación y maneja tu propio vehículo.',
  },
]

export const modeLabel = (m: Mode) => MODE_OPTIONS.find(o => o.value === m)?.title ?? m

export const DEFAULT_RATES: RatesConfig = {
  vehicleBase: 10000,
  vehicleKm: 750,
  driverBase: 15000,
  driverKm: 500,
  wait: 6000,
}

/** Etapas del flujo normal (Cancelada queda fuera) */
export const STAGES: BookingStatus[] = ['Pendiente', 'Confirmada', 'En curso', 'Finalizada']
export const ALL_STATUSES: BookingStatus[] = [...STAGES, 'Cancelada']

/** Solicitudes que ya no avanzan (van al historial) */
export const isClosed = (s: BookingStatus) => s === 'Finalizada' || s === 'Cancelada'

export const WAIT_OPTIONS = ['0', '30', '60', '120', '180', '240', 'custom'] as const

/** Minutos mínimos de anticipación para reservas del mismo día */
export const MIN_NOTICE = 60

export const STORAGE_KEYS = {
  bookings: 'rc_bookings',
  config: 'rc_config',
  fleet: 'vialunexa_fleet',
  users: 'vialunexa_users',
  session: 'vialunexa_session',
  support: 'vialunexa_support',
} as const

export interface SupportCategory {
  label: string
  /** Pregunta adicional que se muestra al elegir esta categoría */
  extra?: { label: string; placeholder?: string; options?: string[] }
}

const LOST_ITEM = { label: 'Describe el objeto', placeholder: 'Ej.: mochila negra con notebook, en el asiento trasero' }

export const SUPPORT_CATEGORIES: Record<'cliente' | 'conductor', SupportCategory[]> = {
  cliente: [
    { label: 'Olvidé una pertenencia en el vehículo', extra: LOST_ITEM },
    { label: 'Problema con el conductor' },
    { label: 'Retraso o el conductor no llegó' },
    { label: 'Problema con el cobro o la tarifa' },
    { label: 'Accidente o situación de seguridad' },
    { label: 'Otro problema' },
  ],
  conductor: [
    {
      label: 'Falla mecánica del vehículo',
      extra: {
        label: '¿El vehículo puede seguir circulando?',
        options: ['Sí, con precaución', 'No, está detenido', 'No estoy seguro'],
      },
    },
    { label: 'Accidente o choque' },
    { label: 'Problema con el pasajero' },
    { label: 'El pasajero no se presentó' },
    { label: 'Encontré una pertenencia del pasajero', extra: { ...LOST_ITEM, label: 'Describe el objeto encontrado' } },
    { label: 'Otro problema' },
  ],
}

export const TICKET_STATUSES: TicketStatus[] = ['Abierto', 'En revisión', 'Resuelto']
