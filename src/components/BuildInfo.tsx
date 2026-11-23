import { useEffect, useState } from 'react'

const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

type ApiState = 'off' | 'checking' | 'up' | 'down'

/**
 * Versión publicada y estado de la API, para que el equipo y los docentes
 * confirmen qué cambio está desplegado.
 */
export function BuildInfo() {
  const [api, setApi] = useState<ApiState>(API_URL ? 'checking' : 'off')
  const [apiCommit, setApiCommit] = useState('')

  useEffect(() => {
    if (!API_URL) return
    const ctrl = new AbortController()
    // En planes gratuitos la API puede tardar en "despertar"
    const timer = setTimeout(() => ctrl.abort(), 60_000)
    // /api/version (y no /actuator/health): la configuración CORS de la API no cubre Actuator
    fetch(`${API_URL}/api/version`, { signal: ctrl.signal })
      .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((j: { commit?: string }) => {
        setApi('up')
        setApiCommit((j.commit ?? '').slice(0, 7))
      })
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
            {api === 'up' && `API: en línea${apiCommit && apiCommit !== 'local' ? ` (${apiCommit})` : ''}`}
            {api === 'down' && 'API: sin conexión'}
          </span>
        </>
      )}
    </div>
  )
}
