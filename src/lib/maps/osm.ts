/**
 * Proveedor gratuito basado en OpenStreetMap (sin API key):
 * - Photon (komoot): sugerencias y geocodificación; tolera errores de tipeo.
 * - OSRM: ruta en auto entre dos puntos.
 * Son servidores públicos para uso moderado.
 */
import { RouteError, type Place, type RouteInfo, type Suggestion } from './types'

const PHOTON = 'https://photon.komoot.io/api/'
const OSRM = 'https://router.project-osrm.org/route/v1/driving'

/** Límites aproximados de Chile (oeste, sur, este, norte) y centro de referencia (Santiago) */
const CHILE_BBOX = '-75.7,-56,-66.4,-17.5'
const BIAS = { lat: '-33.45', lon: '-70.66' }

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')

interface PhotonFeature {
  geometry: { coordinates: [number, number] }
  properties: {
    name?: string
    street?: string
    housenumber?: string
    district?: string
    locality?: string
    city?: string
    county?: string
    state?: string
    osm_key?: string
    osm_value?: string
  }
}

/** Paraderos y andenes: se muestran como la calle donde están, no como "Calle X / esq. Y" */
const STOPS = new Set(['bus_stop', 'platform', 'stop_position', 'stop'])

function toPlace(f: PhotonFeature): Place | null {
  const p = { ...f.properties }
  if (p.osm_value && STOPS.has(p.osm_value)) {
    if (!p.street) return null
    p.name = p.street
    p.osm_key = 'highway'
  }
  const streetNum = p.street ? [p.street, p.housenumber].filter(Boolean).join(' ') : ''
  const isRoad = p.osm_key === 'highway'
  let main: string
  if (p.housenumber && p.street) main = p.name && !isRoad ? `${p.name}, ${streetNum}` : streetNum
  else if (p.name) main = p.street && !isRoad && p.street !== p.name ? `${p.name}, ${p.street}` : p.name
  else main = streetNum
  if (!main) return null
  const parts = [main]
  for (const extra of [p.district || p.locality, p.city || p.county, p.state]) {
    if (extra && !parts.some(x => norm(x) === norm(extra))) parts.push(extra)
  }
  // Se omite la región si ya hay comuna y ciudad, para que la etiqueta sea corta
  const label = (parts.length > 3 ? parts.slice(0, 3) : parts).join(', ')
  const [lon, lat] = f.geometry.coordinates
  return { lat, lon, label }
}

export async function suggest(text: string, signal?: AbortSignal, limit = 6): Promise<Suggestion[]> {
  const url = `${PHOTON}?${new URLSearchParams({ q: text, limit: String(limit + 4), bbox: CHILE_BBOX, ...BIAS })}`
  const res = await fetch(url, { signal })
  if (!res.ok) throw new RouteError('El servicio de mapas no respondió. Intenta nuevamente en unos segundos.')
  const data = (await res.json()) as { features: PhotonFeature[] }
  const seen = new Set<string>()
  const out: Suggestion[] = []
  for (const f of data.features) {
    const place = toPlace(f)
    if (!place || seen.has(norm(place.label))) continue
    seen.add(norm(place.label))
    out.push({ label: place.label, source: 'osm', place })
    if (out.length === limit) break
  }
  return out
}

export async function geocode(text: string, signal?: AbortSignal): Promise<Place | null> {
  const [first] = await suggest(text, signal, 1)
  return first?.place ?? null
}

export async function route(from: Place, to: Place, signal?: AbortSignal): Promise<RouteInfo> {
  const res = await fetch(`${OSRM}/${from.lon},${from.lat};${to.lon},${to.lat}?overview=false`, { signal })
  if (!res.ok) throw new RouteError('No fue posible calcular la ruta. Intenta nuevamente en unos segundos.')
  const data = (await res.json()) as { code: string; routes?: { distance: number; duration: number }[] }
  const r = data.routes?.[0]
  if (data.code !== 'Ok' || !r) throw new RouteError('No existe una ruta en auto entre ambas direcciones.')
  return { km: r.distance / 1000, minutes: r.duration / 60 }
}
