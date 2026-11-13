import { useEffect, useRef, useState, type ChangeEvent, type InputHTMLAttributes, type KeyboardEvent, type Ref } from 'react'
import { rememberSuggestion, suggest, type Suggestion } from '../lib/route'

/** Letras mínimas antes de pedir sugerencias */
const MIN_CHARS = 3

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'onBlur' | 'ref'> & {
  id: string
  value?: string
  ref?: Ref<HTMLInputElement> | ((el: HTMLInputElement | null) => void)
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  onBlur: () => void
  /** Se llama al elegir una sugerencia, con el texto completo de la dirección */
  onPick: (label: string) => void
}

/** Campo de dirección con sugerencias (combobox accesible) mientras el usuario escribe. */
export function AddressInput({ id, value = '', onChange, onBlur, onPick, ...rest }: Props) {
  const [items, setItems] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [loading, setLoading] = useState(false)
  const typed = useRef(false)
  const listId = `${id}-sugerencias`
  const query = value.trim()

  useEffect(() => {
    // Solo busca cuando el cambio viene del teclado (no al elegir una sugerencia)
    if (!typed.current || query.length < MIN_CHARS) return
    const ctrl = new AbortController()
    const t = setTimeout(() => {
      setLoading(true)
      suggest(query, ctrl.signal)
        .then(list => {
          setItems(list)
          setActive(-1)
          setOpen(true)
        })
        .catch(() => {
          if (!ctrl.signal.aborted) setItems([])
        })
        .finally(() => {
          if (!ctrl.signal.aborted) setLoading(false)
        })
    }, 300)
    return () => {
      clearTimeout(t)
      ctrl.abort()
    }
  }, [query])

  function pick(s: Suggestion) {
    rememberSuggestion(s)
    typed.current = false
    setOpen(false)
    setItems([])
    onPick(s.label)
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    typed.current = true
    if (e.target.value.trim().length < MIN_CHARS) setOpen(false)
    onChange(e)
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (!open || !items.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive(i => (i + 1) % items.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive(i => (i <= 0 ? items.length - 1 : i - 1))
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault()
      pick(items[active])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const showList = open && query.length >= MIN_CHARS

  return (
    <div className="combo">
      <input
        {...rest}
        id={id}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKey}
        onFocus={() => items.length && setOpen(true)}
        onBlur={() => {
          setOpen(false)
          onBlur()
        }}
        role="combobox"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
      />
      {loading && <span className="combo-spin" aria-hidden="true" />}
      {showList && (
        <ul className="combo-list" id={listId} role="listbox">
          {items.length ? (
            items.map((p, i) => (
              <li
                key={p.label}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                className={i === active ? 'active' : undefined}
                // mousedown evita que el input pierda el foco antes de elegir
                onMouseDown={e => {
                  e.preventDefault()
                  pick(p)
                }}
                onMouseEnter={() => setActive(i)}
              >
                📍 {p.label}
              </li>
            ))
          ) : (
            <li className="combo-empty">Sin coincidencias. Prueba con el nombre de la calle y la comuna.</li>
          )}
          {/* Atribución exigida por las condiciones de uso de cada proveedor */}
          <li className="combo-attrib" aria-hidden="true">
            {items.some(p => p.source === 'google') ? 'Powered by Google' : '© OpenStreetMap'}
          </li>
        </ul>
      )}
    </div>
  )
}
