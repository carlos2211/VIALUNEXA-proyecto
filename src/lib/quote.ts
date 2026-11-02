import type { Mode, RatesConfig, Trip } from '../types'

export interface QuoteInput {
  mode: Mode
  trip: Trip
  /** Kilómetros solo ida, tal como los ingresa el usuario */
  distance: string
  /** Valor del select de espera ('0', '30', ..., 'custom') */
  wait: string
  customWait: string
}

export interface Quote {
  base: number
  km: number
  wait: number
  waitCost: number
  kmCost: number
  total: number
}

const toInt = (v: string) => Math.max(0, Math.round(Number(v)) || 0)

export function waitMinutes(wait: string, customWait: string) {
  return wait === 'custom' ? toInt(customWait) : Number(wait)
}

export function quote(input: QuoteInput, config: RatesConfig): Quote {
  const driver = input.mode === 'conductor'
  const base = driver ? config.driverBase : config.vehicleBase
  const rate = driver ? config.driverKm : config.vehicleKm
  const km = toInt(input.distance) * (input.trip === 'vuelta' ? 2 : 1)
  const wait = waitMinutes(input.wait, input.customWait)
  const waitCost = (wait / 60) * config.wait
  return { base, km, wait, waitCost, kmCost: km * rate, total: base + km * rate + waitCost }
}
