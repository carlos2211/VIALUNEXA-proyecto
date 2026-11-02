import { useRef, useState, type ChangeEvent } from 'react'
import { useToast } from '../context/ToastContext'

type FormEl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement

/**
 * Reglas por campo. Se evalúan en este orden:
 * when → (archivo: checkFile) → badInput → required → minLen → maxLen → check
 */
export interface FieldRule<K extends string> {
  required?: boolean
  /** Si devuelve false el campo no se valida (p. ej. espera personalizada oculta) */
  when?: (values: Record<K, string>) => boolean
  minLen?: number
  maxLen?: number
  /** Muestra el contador de caracteres bajo el campo */
  counter?: boolean
  /** Campo de tipo archivo: se valida con checkFile en vez de check */
  file?: boolean
  check?: (value: string, values: Record<K, string>) => string
  checkFile?: (file: File | null) => string
  /** Se aplica al salir del campo, solo si el valor es válido */
  format?: (value: string) => string
  /** Se aplica mientras se escribe */
  transform?: (value: string) => string
}

export type Rules<K extends string> = Partial<Record<K, FieldRule<K>>>

export function useForm<K extends string>(rules: Rules<K>, initial: Record<K, string>) {
  const toast = useToast()
  const [values, setValuesState] = useState(initial)
  const [files, setFiles] = useState<Partial<Record<K, File | null>>>({})
  const [touched, setTouched] = useState<ReadonlySet<K>>(new Set())
  const els = useRef(new Map<K, FormEl>())

  const computeError = (id: K, vals = values): string => {
    const f = rules[id]
    if (!f) return ''
    if (f.when && !f.when(vals)) return ''
    if (f.file) return f.checkFile?.(files[id] ?? null) ?? ''
    const v = (vals[id] ?? '').trim()
    const el = els.current.get(id)
    if (el instanceof HTMLInputElement && el.validity.badInput) return 'Solo se permiten números.'
    if (!v) return f.required ? 'Este campo es obligatorio.' : ''
    if (f.minLen && v.length < f.minLen) return `Debe tener al menos ${f.minLen} caracteres (llevas ${v.length}).`
    if (f.maxLen && v.length > f.maxLen) return `Máximo ${f.maxLen} caracteres (llevas ${v.length}).`
    return f.check?.(v, vals) ?? ''
  }

  const touch = (ids: K[]) =>
    setTouched(prev => {
      if (ids.every(id => prev.has(id))) return prev
      const next = new Set(prev)
      ids.forEach(id => next.add(id))
      return next
    })

  const setValues = (patch: Partial<Record<K, string>>) => setValuesState(v => ({ ...v, ...patch }))
  const setValue = (id: K, value: string) => setValues({ [id]: value } as Partial<Record<K, string>>)

  /** Error visible (solo para campos ya tocados) */
  const errorOf = (id: K) => (touched.has(id) ? computeError(id) : '')

  const isFilled = (id: K) => (rules[id]?.file ? !!files[id] : !!(values[id] ?? '').trim())

  function bind(id: K) {
    const f = rules[id]
    const msg = errorOf(id)
    const cls = msg ? 'invalid' : touched.has(id) && isFilled(id) ? 'valid' : undefined

    const onChange = (e: ChangeEvent<FormEl>) => {
      const el = e.target
      if (f?.file) {
        setFiles(prev => ({ ...prev, [id]: (el as HTMLInputElement).files?.[0] ?? null }))
        touch([id])
        return
      }
      let value = el.value
      if (f?.transform) {
        const after = f.transform(value)
        if (after !== value && !(el instanceof HTMLSelectElement)) {
          // Mantiene el cursor en su lugar al quitar caracteres
          const pos = Math.max(0, (el.selectionStart ?? after.length) - (value.length - after.length))
          el.value = after
          try {
            el.setSelectionRange(pos, pos)
          } catch {
            /* algunos tipos de input no admiten selección */
          }
          value = after
        }
      }
      setValue(id, value)
      // Equivalente al evento nativo "change": selects y fechas se confirman al elegir
      if (el instanceof HTMLSelectElement || el.type === 'date' || el.type === 'time') touch([id])
    }

    const onBlur = () => {
      if (f?.file) return
      const v = (values[id] ?? '').trim()
      if (!v && !touched.has(id)) return
      touch([id])
      if (f?.format && v && !computeError(id)) setValue(id, f.format(v))
    }

    return {
      id,
      ref: (el: FormEl | null) => {
        if (el) els.current.set(id, el)
        else els.current.delete(id)
      },
      ...(f?.file ? {} : { value: values[id] ?? '' }),
      onChange,
      onBlur,
      className: cls,
      maxLength: f?.maxLen,
      'aria-required': f?.required || undefined,
      'aria-invalid': msg ? true : undefined,
      'aria-describedby': f ? `${id}-err` : undefined,
    }
  }

  /** Marca los campos como tocados y enfoca el primero con error. Devuelve true si todo es válido. */
  function validate(ids: K[], vals = values) {
    touch(ids)
    const bad = ids.filter(id => computeError(id, vals))
    if (bad.length) {
      const el = els.current.get(bad[0])
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setTimeout(() => el?.focus({ preventScroll: true }), 300)
      toast(bad.length === 1 ? 'Revisa el campo marcado en rojo.' : `Revisa los ${bad.length} campos marcados en rojo.`, 'error')
    }
    return !bad.length
  }

  /** Aplica los formatos de los campos indicados y devuelve los valores resultantes. */
  function applyFormats(ids: K[]) {
    const next = { ...values }
    for (const id of ids) {
      const f = rules[id]
      const v = (next[id] ?? '').trim()
      if (f?.format && !f.file && v) next[id] = f.format(v)
    }
    setValuesState(next)
    return next
  }

  function reset(ids: K[]) {
    setValues(Object.fromEntries(ids.map(id => [id, ''])) as Partial<Record<K, string>>)
    setFiles(prev => {
      const next = { ...prev }
      ids.forEach(id => delete next[id])
      return next
    })
    setTouched(prev => new Set([...prev].filter(id => !ids.includes(id))))
    ids.forEach(id => {
      const el = els.current.get(id)
      if (el instanceof HTMLInputElement && el.type === 'file') el.value = ''
    })
  }

  /** Limpia el estado de "tocado" sin cambiar valores */
  const untouch = (ids: K[]) => setTouched(prev => new Set([...prev].filter(id => !ids.includes(id))))

  return { rules, values, files, setValue, setValues, bind, errorOf, validate, applyFormats, reset, untouch }
}

export type FormApi<K extends string> = ReturnType<typeof useForm<K>>
