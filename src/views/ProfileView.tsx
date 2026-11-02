import { useEffect } from 'react'
import { Field } from '../components/Field'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useForm, type Rules } from '../hooks/useForm'
import { formatPhone, phoneInput, titleCase } from '../lib/format'
import { personName, phoneCheck } from '../lib/validators'

type ProfileKey = 'profileName' | 'profilePhone'
const FIELDS: ProfileKey[] = ['profileName', 'profilePhone']

const rules: Rules<ProfileKey> = {
  profileName: { required: true, minLen: 5, maxLen: 60, format: titleCase, check: personName },
  profilePhone: { required: true, maxLen: 20, transform: phoneInput, format: formatPhone, check: phoneCheck },
}

const ROLE_LABEL = { admin: 'Administrador', conductor: 'Conductor', cliente: 'Cliente' }

/** Datos de la cuenta del cliente. */
export function ProfileView({ hidden }: { hidden: boolean }) {
  const { user, updateProfile } = useAuth()
  const toast = useToast()
  const form = useForm(rules, { profileName: user?.name ?? '', profilePhone: user?.phone ?? '' })

  // Al volver a la pestaña se descartan cambios sin guardar
  useEffect(() => {
    if (hidden || !user) return
    form.setValues({ profileName: user.name, profilePhone: user.phone })
    form.untouch(FIELDS)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hidden])

  if (!user) return null

  function save() {
    if (!form.validate(FIELDS)) return
    const f = form.applyFormats(FIELDS)
    if (updateProfile({ name: f.profileName.trim(), phone: formatPhone(f.profilePhone) }))
      toast('Datos actualizados.', 'success')
    else toast('No fue posible guardar los datos.', 'error')
  }

  return (
    <section id="profile" className={hidden ? 'hidden' : undefined}>
      <div className="card">
        <h2>Mis datos</h2>
        <div className="line">
          <span>Correo (usuario)</span>
          <strong>{user.email}</strong>
        </div>
        <div className="line">
          <span>Tipo de cuenta</span>
          <strong>{ROLE_LABEL[user.role]}</strong>
        </div>
        <div className="line">
          <span>Registrado desde</span>
          <strong>{new Date(user.created).toLocaleDateString('es-CL')}</strong>
        </div>
        <h3>Editar datos de contacto</h3>
        <div className="grid">
          <Field form={form} name="profileName" label="Nombre y apellido">
            <input {...form.bind('profileName')} autoComplete="name" autoCapitalize="words" />
          </Field>
          <Field form={form} name="profilePhone" label="Teléfono">
            <input type="tel" {...form.bind('profilePhone')} inputMode="tel" autoComplete="tel" />
          </Field>
        </div>
        <button type="button" className="primary full" onClick={save}>
          Guardar cambios
        </button>
        <p className="hint">Estos datos se completan automáticamente al solicitar un viaje.</p>
      </div>
    </section>
  )
}
