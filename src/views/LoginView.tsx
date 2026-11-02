import { useState, type FormEvent } from 'react'
import { Field } from '../components/Field'
import { DEMO_ACCOUNTS, useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useForm, type Rules } from '../hooks/useForm'
import { formatPhone, phoneInput, titleCase } from '../lib/format'
import { emailCheck, personName, phoneCheck } from '../lib/validators'

type LoginKey = 'loginEmail' | 'loginPassword'
const LOGIN_FIELDS: LoginKey[] = ['loginEmail', 'loginPassword']

const loginRules: Rules<LoginKey> = {
  loginEmail: { required: true, maxLen: 100, format: v => v.trim().toLowerCase(), check: emailCheck },
  loginPassword: { required: true, maxLen: 64 },
}

type RegKey = 'regRole' | 'regName' | 'regEmail' | 'regPhone' | 'regPassword' | 'regPassword2'
const REG_FIELDS: RegKey[] = ['regName', 'regEmail', 'regPhone', 'regPassword', 'regPassword2']

const regRules: Rules<RegKey> = {
  regName: { required: true, minLen: 5, maxLen: 60, format: titleCase, check: personName },
  regEmail: { required: true, maxLen: 100, format: v => v.trim().toLowerCase(), check: emailCheck },
  regPhone: { required: true, maxLen: 20, transform: phoneInput, format: formatPhone, check: phoneCheck },
  regPassword: {
    required: true,
    minLen: 6,
    maxLen: 64,
    check: v => (/[A-Za-z]/.test(v) && /\d/.test(v) ? '' : 'Usa al menos una letra y un número.'),
  },
  regPassword2: {
    required: true,
    maxLen: 64,
    check: (v, all) => (v === all.regPassword ? '' : 'Las contraseñas no coinciden.'),
  },
}

export function LoginView() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [busy, setBusy] = useState(false)
  const { login, register } = useAuth()
  const toast = useToast()
  const loginForm = useForm(loginRules, { loginEmail: '', loginPassword: '' })
  const regForm = useForm(regRules, {
    regRole: 'cliente',
    regName: '',
    regEmail: '',
    regPhone: '',
    regPassword: '',
    regPassword2: '',
  })

  async function onLogin(e: FormEvent) {
    e.preventDefault()
    if (busy || !loginForm.validate(LOGIN_FIELDS)) return
    const f = loginForm.applyFormats(LOGIN_FIELDS)
    setBusy(true)
    const err = await login(f.loginEmail, f.loginPassword)
    setBusy(false)
    if (err) toast(err, 'error')
  }

  async function onRegister(e: FormEvent) {
    e.preventDefault()
    if (busy || !regForm.validate(REG_FIELDS)) return
    const f = regForm.applyFormats(REG_FIELDS)
    setBusy(true)
    const err = await register({
      role: f.regRole === 'conductor' ? 'conductor' : 'cliente',
      name: f.regName.trim(),
      email: f.regEmail,
      phone: formatPhone(f.regPhone),
      password: f.regPassword,
    })
    setBusy(false)
    if (err) toast(err, 'error')
    else toast('Cuenta creada. ¡Bienvenido/a!', 'success')
  }

  function fillDemo(email: string, password: string) {
    setMode('login')
    loginForm.setValues({ loginEmail: email, loginPassword: password })
  }

  return (
    <section className="auth">
      <div className="card">
        <div className="auth-switch" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={mode === 'login' ? 'active' : undefined}
            onClick={() => setMode('login')}
          >
            <span className="ico" aria-hidden="true">🔑</span>
            Iniciar sesión
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            className={mode === 'register' ? 'active' : undefined}
            onClick={() => setMode('register')}
          >
            <span className="ico" aria-hidden="true">✨</span>
            Crear cuenta
          </button>
        </div>

        {mode === 'login' ? (
          <form onSubmit={onLogin} noValidate>
            <h2>Ingresa a tu cuenta</h2>
            <Field form={loginForm} name="loginEmail" label="Correo electrónico">
              <input
                type="email"
                {...loginForm.bind('loginEmail')}
                placeholder="correo@ejemplo.cl"
                inputMode="email"
                autoComplete="username"
                autoCapitalize="off"
                spellCheck={false}
              />
            </Field>
            <Field form={loginForm} name="loginPassword" label="Contraseña">
              <input type="password" {...loginForm.bind('loginPassword')} autoComplete="current-password" />
            </Field>
            <button type="submit" className="primary full" disabled={busy}>
              Ingresar<span className="arrow" aria-hidden="true">→</span>
            </button>
          </form>
        ) : (
          <form onSubmit={onRegister} noValidate>
            <h2>Crea tu cuenta</h2>
            <div className="field">
              <label htmlFor="regRole">Tipo de cuenta</label>
              <select {...regForm.bind('regRole')}>
                <option value="cliente">Cliente · quiero cotizar y reservar viajes</option>
                <option value="conductor">Conductor · quiero ofrecer mis servicios</option>
              </select>
            </div>
            <Field form={regForm} name="regName" label="Nombre y apellido">
              <input {...regForm.bind('regName')} placeholder="Ej.: María González" autoComplete="name" autoCapitalize="words" />
            </Field>
            <div className="grid">
              <Field form={regForm} name="regEmail" label="Correo electrónico">
                <input
                  type="email"
                  {...regForm.bind('regEmail')}
                  placeholder="correo@ejemplo.cl"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="off"
                  spellCheck={false}
                />
              </Field>
              <Field form={regForm} name="regPhone" label="Teléfono">
                <input type="tel" {...regForm.bind('regPhone')} placeholder="+56 9 1234 5678" inputMode="tel" autoComplete="tel" />
              </Field>
              <Field form={regForm} name="regPassword" label="Contraseña">
                <input type="password" {...regForm.bind('regPassword')} autoComplete="new-password" />
              </Field>
              <Field form={regForm} name="regPassword2" label="Repite la contraseña">
                <input type="password" {...regForm.bind('regPassword2')} autoComplete="new-password" />
              </Field>
            </div>
            <button type="submit" className="primary full" disabled={busy}>
              Crear mi cuenta<span className="arrow" aria-hidden="true">→</span>
            </button>
            <p className="hint">Las cuentas de administrador solo se crean internamente.</p>
          </form>
        )}
      </div>

      <div className="card">
        <h2>Cuentas de prueba</h2>
        <p className="hint">Toca una cuenta para completar el formulario de ingreso.</p>
        <div className="demo-accounts">
          {DEMO_ACCOUNTS.map(a => (
            <button key={a.email} type="button" className="secondary" onClick={() => fillDemo(a.email, a.password)}>
              <b>{a.role}</b>
              <span>
                {a.email} · {a.password}
              </span>
            </button>
          ))}
        </div>
        <div className="notice" style={{ marginTop: 12 }}>
          Acceso de demostración: usuarios y sesión se guardan solo en este navegador. Para uso real se requiere un
          servidor con autenticación segura.
        </div>
      </div>
    </section>
  )
}
