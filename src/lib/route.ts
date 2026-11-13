/**
 * Direcciones y distancias del viaje.
 *
 * Si existe VITE_GOOGLE_MAPS_KEY (en .env.local) se usa Google Maps Platform; si no,
 * OpenStreetMap (Photon + OSRM, gratis y sin clave). Si Google falla (clave inválida,
 * cupo agotado, sin conexión), cada consulta reintenta automáticamente con OpenStreetMap.
 *
 * Cuando exista backend conviene mover estas llamadas al servidor, para no exponer
 * la clave y para que el precio no dependa del navegador del cliente.
 */
import * as google from './maps/google'
import * as osm from './maps/osm'
import { RouteError, type MapsSource, type Place, type Suggestion } from './maps/types'

export { RouteError }
export type { Place, Suggestion }

export const MAPS_PROVIDER: MapsSource = google.GOOGLE_KEY ? 'google' : 'osm'

export interface RouteResult {
  /** Kilómetros por carretera, solo ida (con decimales) */
  km: number
  /** Duración estimada en minutos, solo ida */
  minutes: number
  from: Place
  to: Place
  source: MapsSource
}

const placeCache = new Map<string, Place>()
const picked = new Map<string, Suggestion>()
const suggestCache = new Map<string, Suggestion[]>()
const routeCache = new Map<string, RouteResult>()

const key = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')

/** Usa Google y, si falla por cualquier motivo que no sea cancelación, OpenStreetMap */
async function withFallback<T>(signal: AbortSignal | undefined, viaGoogle: () => Promise<T>, viaOsm: () => Promise<T>) {
  if (MAPS_PROVIDER !== 'google') return viaOsm()
  try {
    return await viaGoogle()
  } catch (err) {
    if (signal?.aborted || err instanceof RouteError) throw err
    return viaOsm()
  }
}

/** Sugerencias de direcciones en Chile para lo que el usuario lleva escrito */
export async function suggest(text: string, signal?: AbortSignal): Promise<Suggestion[]> {
  const k = key(text)
  const hit = suggestCache.get(k)
  if (hit) return hit
  const list = await withFallback(signal, () => google.suggest(text, signal), () => osm.suggest(text, signal))
  suggestCache.set(k, list)
  return list
}

/** Registra la sugerencia elegida para usar sus coordenadas exactas al calcular la ruta */
export function rememberSuggestion(s: Suggestion) {
  if (s.place) placeCache.set(key(s.label), s.place)
  else picked.set(key(s.label), s)
}

export async function geocode(address: string, signal?: AbortSignal): Promise<Place> {
  const k = key(address)
  const hit = placeCache.get(k)
  if (hit) return hit
  const chosen = picked.get(k)
  const place = await withFallback(
    signal,
    () => (chosen?.placeId ? google.details(chosen.placeId, chosen.label, signal) : google.geocode(address, signal)),
    () => osm.geocode(address, signal),
  )
  if (!place) throw new RouteError(`No encontramos la dirección "${address}". Elige una de las sugerencias de la lista.`)
  placeCache.set(k, place)
  return place
}

export async function routeBetween(origin: string, destination: string, signal?: AbortSignal): Promise<RouteResult> {
  const k = key(origin) + '→' + key(destination)
  const hit = routeCache.get(k)
  if (hit) return hit
  const [from, to] = await Promise.all([geocode(origin, signal), geocode(destination, signal)])
  let source: MapsSource = MAPS_PROVIDER
  const info = await withFallback(
    signal,
    () => google.route(from, to, signal),
    () => {
      source = 'osm'
      return osm.route(from, to, signal)
    },
  )
  const result = { ...info, from, to, source }
  routeCache.set(k, result)
  return result
}
