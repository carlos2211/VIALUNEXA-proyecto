import { useEffect, useState } from 'react'

const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

type ApiState = 'off' | 'checking' | 'up' | 'down'

/**
 * Versión publicada y estado de la API, para que el equipo y los docentes
 * confirmen qué cambio está desplegado.
 */
export function BuildInfo() {
  const [api, setApi] = useState<ApiState>(API_URL ? 'checking' : 'off')

  useEffect(() => {
    if (!API_URL) return
    const ctrl = new AbortController()
    // En planes gratuitos la API puede tardar en "despertar"
    const timer = setTimeout(() => ctrl.abort(), 60_000)
    fetch(`${API_URL}/actuator/health`, { signal: ctrl.signal })
      .then(r => r.json())
      .then((j: { status?: string }) => setApi(j.status === 'UP' ? 'up' : 'down'))
      .catch(() => setApi('down'))
      .finally(() => clearTimeout(timer))
    return () => {
      clearTimeout(timer)
      ctrl.abort()
    }
  }, [])

  const built = new Date(__BUILD_DATE__).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })

  return (
    <div className="buildinfo">
      {__APP_COMMIT__ && <>Versión {__APP_COMMIT__} · </>}Compilada {built}
      {api !== 'off' && (
        <>
          {' · '}
          <span className={`api-${api}`}>
            {api === 'checking' && 'API: conectando…'}
            {api === 'up' && 'API: en línea'}
            {api === 'down' && 'API: sin conexión'}
          </span>
        </>
      )}
    </div>
  )
}
