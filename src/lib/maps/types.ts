export interface Place {
  lat: number
  lon: number
  /** Texto legible de la dirección */
  label: string
}

export type MapsSource = 'google' | 'osm'

/** Opción de la lista de sugerencias */
export interface Suggestion {
  label: string
  source: MapsSource
  /** OpenStreetMap entrega las coordenadas junto con la sugerencia */
  place?: Place
  /** Google entrega un id; las coordenadas se piden al elegirla */
  placeId?: string
}

export interface RouteInfo {
  /** Kilómetros por carretera, solo ida (con decimales) */
  km: number
  /** Duración estimada en minutos, solo ida */
  minutes: number
}

export class RouteError extends Error {}
