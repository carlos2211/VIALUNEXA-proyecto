/**
 * Proveedor Google Maps Platform (requiere VITE_GOOGLE_MAPS_KEY en .env.local):
 * - Places API (New): sugerencias (Autocomplete) y coordenadas del lugar elegido (Place Details).
 * - Routes API: distancia y duración en auto.
 *
 * Usa sesiones de autocompletado (sessionToken), así Google agrupa las letras tecleadas
 * y la selección final en una sola sesión de cobro.
 * IMPORTANTE: en el frontend la clave queda visible; restríngela por dominio y por API en Google Cloud.
 */
import { RouteError, type Place, type RouteInfo, type Suggestion } from './types'

export const GOOGLE_KEY: string = import.meta.env.VITE_GOOGLE_MAPS_KEY ?? ''

const PLACES = 'https://places.googleapis.com/v1'
const ROUTES = 'https://routes.googleapis.com/directions/v2:computeRoutes'

let session = ''
const sessionToken = () => (session ||= crypto.randomUUID())

async function call<T>(url: string, init: RequestInit & { fieldMask?: string }): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_KEY,
      ...(init.fieldMask ? { 'X-Goog-FieldMask': init.fieldMask } : {}),
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    // Clave inválida, API no habilitada, cupo agotado, etc. Se deja en consola para el desarrollador.
    console.warn('[Google Maps]', res.status, (data as { error?: { message?: string } }).error?.message)
    throw new Error(`Google Maps respondió ${res.status}`)
  }
  return data as T
}

interface AutocompleteResponse {
  suggestions?: { placePrediction?: { placeId: string; text: { text: string } } }[]
}

export async function suggest(text: string, signal?: AbortSignal, limit = 6): Promise<Suggestion[]> {
  const data = await call<AutocompleteResponse>(`${PLACES}/places:autocomplete`, {
    method: 'POST',
    signal,
    body: JSON.stringify({
      input: text,
      includedRegionCodes: ['cl'],
      languageCode: 'es',
      sessionToken: sessionToken(),
    }),
  })
  return (data.suggestions ?? [])
    .flatMap(s => (s.placePrediction ? [s.placePrediction] : []))
    .slice(0, limit)
    .map(p => ({ label: p.text.text.replace(/, Chile$/, ''), source: 'google' as const, placeId: p.placeId }))
}

/** Coordenadas de una sugerencia elegida (cierra la sesión de autocompletado) */
export async function details(placeId: string, label: string, signal?: AbortSignal): Promise<Place> {
  const token = session
  session = ''
  const qs = token ? `?sessionToken=${encodeURIComponent(token)}` : ''
  const data = await call<{ location?: { latitude: number; longitude: number } }>(
    `${PLACES}/places/${encodeURIComponent(placeId)}${qs}`,
    { method: 'GET', signal, fieldMask: 'location' },
  )
  if (!data.location) throw new RouteError(`No encontramos la ubicación de "${label}".`)
  return { lat: data.location.latitude, lon: data.location.longitude, label }
}

export async function geocode(text: string, signal?: AbortSignal): Promise<Place | null> {
  const [first] = await suggest(text, signal, 1)
  return first?.placeId ? details(first.placeId, first.label, signal) : null
}

export async function route(from: Place, to: Place, signal?: AbortSignal): Promise<RouteInfo> {
  const point = (p: Place) => ({ location: { latLng: { latitude: p.lat, longitude: p.lon } } })
  const data = await call<{ routes?: { distanceMeters?: number; duration?: string }[] }>(ROUTES, {
    method: 'POST',
    signal,
    fieldMask: 'routes.distanceMeters,routes.duration',
    body: JSON.stringify({
      origin: point(from),
      destination: point(to),
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_UNAWARE',
      units: 'METRIC',
      languageCode: 'es',
    }),
  })
  const r = data.routes?.[0]
  if (!r?.distanceMeters) throw new RouteError('No existe una ruta en auto entre ambas direcciones.')
  return { km: r.distanceMeters / 1000, minutes: parseFloat(r.duration ?? '0') / 60 }
}
