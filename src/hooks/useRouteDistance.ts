import { useEffect, useState } from 'react'
import { RouteError, routeBetween, type RouteResult } from '../lib/route'

export type RouteState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ok'; route: RouteResult }
  | { status: 'error'; message: string }

type Settled = { key: string } & ({ route: RouteResult } | { message: string })

/**
 * Calcula la distancia entre origen y destino cuando ambos son válidos.
 * Espera a que el usuario deje de escribir (`delay` ms) y cancela consultas obsoletas.
 */
export function useRouteDistance(origin: string, destination: string, enabled: boolean, delay = 1000) {
  const [retry, setRetry] = useState(0)
  const [settled, setSettled] = useState<Settled | null>(null)
  const key = `${origin}\n${destination}\n${retry}`

  useEffect(() => {
    if (!enabled) return
    const ctrl = new AbortController()
    const t = setTimeout(() => {
      routeBetween(origin, destination, ctrl.signal)
        .then(route => setSettled({ key, route }))
        .catch(err => {
          if (ctrl.signal.aborted) return
          setSettled({
            key,
            message:
              err instanceof RouteError
                ? err.message
                : 'Sin conexión con el servicio de mapas.',
          })
        })
    }, delay)
    return () => {
      clearTimeout(t)
      ctrl.abort()
    }
  }, [key, origin, destination, enabled, delay])

  let state: RouteState
  if (!enabled) state = { status: 'idle' }
  else if (settled?.key !== key) state = { status: 'loading' }
  else if ('route' in settled) state = { status: 'ok', route: settled.route }
  else state = { status: 'error', message: settled.message }

  return { state, retry: () => setRetry(n => n + 1) }
}
