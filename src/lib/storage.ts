export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    const v = JSON.parse(raw) as T | null
    return v ?? fallback
  } catch {
    return fallback
  }
}

/** Guarda en localStorage. Devuelve false si no hay espacio o el acceso está bloqueado. */
export function writeJSON(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}
