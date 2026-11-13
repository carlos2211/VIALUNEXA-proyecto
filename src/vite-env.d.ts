/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Clave de Google Maps Platform (opcional). Sin ella se usa OpenStreetMap. */
  readonly VITE_GOOGLE_MAPS_KEY?: string
}
