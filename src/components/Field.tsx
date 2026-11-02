import type { ReactNode } from 'react'
import type { FormApi } from '../hooks/useForm'

interface Props<K extends string> {
  form: FormApi<K>
  name: K
  label: ReactNode
  children: ReactNode
}

/** Contenedor de campo: etiqueta (con * si es obligatorio), control, contador y mensaje de error. */
export function Field<K extends string>({ form, name, label, children }: Props<K>) {
  const rule = form.rules[name]
  const msg = form.errorOf(name)
  const len = (form.values[name] ?? '').length

  return (
    <div className="field">
      <label htmlFor={name}>
        {label}
        {rule?.required && (
          <>
            {' '}
            <span className="req" aria-hidden="true">*</span>
          </>
        )}
      </label>
      {children}
      {rule?.counter && rule.maxLen && (
        <div className={`counter${len > rule.maxLen * 0.9 ? ' near' : ''}`}>
          {len}/{rule.maxLen}
        </div>
      )}
      {rule && (
        <div className="error-msg" id={`${name}-err`} hidden={!msg}>
          {msg}
        </div>
      )}
    </div>
  )
}
