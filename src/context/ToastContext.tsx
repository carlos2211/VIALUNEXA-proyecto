import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

export type ToastType = '' | 'error' | 'success'
type ToastFn = (msg: string, type?: ToastType) => void

const ToastContext = createContext<ToastFn>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState({ msg: '', type: '' as ToastType, show: false })
  const timer = useRef<number>(undefined)

  const toast = useCallback<ToastFn>((msg, type = '') => {
    setState({ msg, type, show: true })
    clearTimeout(timer.current)
    timer.current = window.setTimeout(
      () => setState(s => ({ ...s, show: false })),
      type === 'error' ? 4000 : 3200,
    )
  }, [])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className={`toast ${state.show ? 'show ' : ''}${state.type}`} role="status" aria-live="polite">
        {state.msg}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
