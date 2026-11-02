import { createContext, useContext, useState, type ReactNode } from 'react'
import { DEFAULT_RATES, STORAGE_KEYS } from '../lib/constants'
import { readJSON, writeJSON } from '../lib/storage'
import type { Booking, Fleet, FleetEntry, FleetKind, RatesConfig, SupportTicket } from '../types'

interface AppData {
  bookings: Booking[]
  fleet: Fleet
  config: RatesConfig
  tickets: SupportTicket[]
  /** Todas las operaciones devuelven false si no se pudo guardar (y no cambian el estado). */
  addBooking: (b: Booking) => boolean
  updateBooking: (id: string, patch: Partial<Booking>) => boolean
  addFleetEntry: (entry: FleetEntry) => boolean
  /** Reemplaza el registro con el mismo id, o lo agrega si no existe */
  saveFleetEntry: (entry: FleetEntry) => boolean
  removeFleetEntry: (kind: FleetKind, id: string) => boolean
  saveConfig: (config: RatesConfig) => boolean
  addTicket: (t: SupportTicket) => boolean
  updateTicket: (id: string, patch: Partial<SupportTicket>) => boolean
}

const AppDataContext = createContext<AppData | null>(null)

function loadBookings(): Booking[] {
  const b = readJSON<unknown>(STORAGE_KEYS.bookings, [])
  return Array.isArray(b) ? (b as Booking[]) : []
}

function loadFleet(): Fleet {
  const f = readJSON<Partial<Fleet>>(STORAGE_KEYS.fleet, {})
  return {
    drivers: Array.isArray(f.drivers) ? f.drivers : [],
    vehicles: Array.isArray(f.vehicles) ? f.vehicles : [],
  }
}

function loadTickets(): SupportTicket[] {
  const t = readJSON<unknown>(STORAGE_KEYS.support, [])
  return Array.isArray(t) ? (t as SupportTicket[]) : []
}

const listKey = (kind: FleetKind) => (kind === 'driver' ? 'drivers' : 'vehicles')

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [bookings, setBookings] = useState(loadBookings)
  const [fleet, setFleet] = useState(loadFleet)
  const [tickets, setTickets] = useState(loadTickets)
  const [config, setConfig] = useState<RatesConfig>(() => ({
    ...DEFAULT_RATES,
    ...readJSON<Partial<RatesConfig>>(STORAGE_KEYS.config, {}),
  }))

  const commitBookings = (next: Booking[]) => {
    if (!writeJSON(STORAGE_KEYS.bookings, next)) return false
    setBookings(next)
    return true
  }

  const commitFleet = (next: Fleet) => {
    if (!writeJSON(STORAGE_KEYS.fleet, next)) return false
    setFleet(next)
    return true
  }

  const commitTickets = (next: SupportTicket[]) => {
    if (!writeJSON(STORAGE_KEYS.support, next)) return false
    setTickets(next)
    return true
  }

  const value: AppData = {
    bookings,
    fleet,
    config,
    tickets,
    addTicket: t => commitTickets([t, ...tickets]),
    updateTicket: (id, patch) => commitTickets(tickets.map(t => (t.id === id ? { ...t, ...patch } : t))),
    addBooking: b => commitBookings([b, ...bookings]),
    updateBooking: (id, patch) => commitBookings(bookings.map(b => (b.id === id ? { ...b, ...patch } : b))),
    addFleetEntry: entry => {
      const key = listKey(entry.kind)
      return commitFleet({ ...fleet, [key]: [...fleet[key], entry] })
    },
    saveFleetEntry: entry => {
      const key = listKey(entry.kind)
      const list = fleet[key]
      const next = list.some(x => x.id === entry.id) ? list.map(x => (x.id === entry.id ? entry : x)) : [...list, entry]
      return commitFleet({ ...fleet, [key]: next })
    },
    removeFleetEntry: (kind, id) => {
      const key = listKey(kind)
      return commitFleet({ ...fleet, [key]: fleet[key].filter(x => x.id !== id) })
    },
    saveConfig: next => {
      if (!writeJSON(STORAGE_KEYS.config, next)) return false
      setConfig(next)
      return true
    },
  }

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData() {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw Error('useAppData debe usarse dentro de <AppDataProvider>')
  return ctx
}
