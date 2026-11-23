/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Clave de Google Maps Platform (opcional). Sin ella se usa OpenStreetMap. */
  readonly VITE_GOOGLE_MAPS_KEY?: string
  /** URL pública de la API (opcional), p. ej. https://vialunexa-api.onrender.com */
  readonly VITE_API_URL?: string
}

/** Commit corto compilado ('' en desarrollo local) */
declare const __APP_COMMIT__: string
/** Fecha y hora de compilación (ISO) */
declare const __BUILD_DATE__: string
