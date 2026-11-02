import { useState } from 'react'
import { Field } from '../components/Field'
import { useAppData } from '../context/AppDataContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useForm, type Rules } from '../hooks/useForm'
import { MODE_OPTIONS, SERVICE_TYPES, WAIT_OPTIONS } from '../lib/constants'
import { addDaysISO, cleanSpaces, formatPhone, money, phoneInput, sameText, titleCase, todayISO } from '../lib/format'
import { quote } from '../lib/quote'
import {
  address,
  dateCheck,
  emailCheck,
  intRule,
  personName,
  phoneCheck,
  safeText,
  timeCheck,
} from '../lib/validators'
import type { Booking, Mode, Trip } from '../types'

type BookKey =
  | 'mode' | 'date' | 'time' | 'origin' | 'destination' | 'trip' | 'wait' | 'customWait'
  | 'distance' | 'passengers' | 'name' | 'phone' | 'email' | 'notes'

const BOOK_FIELDS: BookKey[] = [
  'date', 'time', 'origin', 'destination', 'customWait', 'distance', 'passengers', 'name', 'phone', 'email', 'notes',
]

const CONTACT_FIELDS: BookKey[] = ['name', 'phone', 'email']

const rules: Rules<BookKey> = {
  date: { required: true, check: dateCheck },
  time: { required: true, check: (v, all) => timeCheck(v, all.date) },
  origin: { required: true, minLen: 5, maxLen: 150, format: cleanSpaces, check: address },
  destination: {
    required: true,
    minLen: 5,
    maxLen: 150,
    format: cleanSpaces,
    check: (v, all) => address(v) || (sameText(v, all.origin) ? 'El destino debe ser distinto al lugar de recogida.' : ''),
  },
  customWait: { required: true, when: all => all.wait === 'custom', check: intRule(1, 1440, ' minutos (máx. 24 horas)') },
  distance: { required: true, check: intRule(1, 2000, ' km') },
  passengers: { required: true, check: intRule(1, 8, ' pasajeros') },
  name: { required: true, minLen: 5, maxLen: 60, format: titleCase, check: personName },
  phone: { required: true, maxLen: 20, transform: phoneInput, format: formatPhone, check: phoneCheck },
  email: { maxLen: 100, format: v => v.trim().toLowerCase(), check: emailCheck },
  notes: { maxLen: 500, counter: true, check: safeText },
}

export function BookView({ hidden, onReserved }: { hidden: boolean; onReserved: (b: Booking) => void }) {
  const { config, addBooking } = useAppData()
  const { user } = useAuth()
  const toast = useToast()
  const [chosen, setChosen] = useState(0)
  const form = useForm(rules, {
    mode: 'vehiculo',
    date: addDaysISO(1),
    time: '09:00',
    origin: '',
    destination: '',
    trip: 'ida',
    wait: '0',
    customWait: '90',
    distance: '85',
    passengers: '1',
    name: user?.name ?? '',
    phone: user?.phone ?? '',
    email: user?.email ?? '',
    notes: '',
  })
  const v = form.values
  const q = quote({ mode: v.mode as Mode, trip: v.trip as Trip, distance: v.distance, wait: v.wait, customWait: v.customWait }, config)

  // Con datos registrados, el contacto no se vuelve a pedir (salvo que el cliente quiera cambiarlo)
  const hasProfile = !!(user?.name && user.phone)
  const [editContact, setEditContact] = useState(false)
  const showContact = !hasProfile || editContact
  const fields = showContact ? BOOK_FIELDS : BOOK_FIELDS.filter(k => !CONTACT_FIELDS.includes(k))

  function applyProfileContact() {
    form.setValues({ name: user?.name ?? '', phone: user?.phone ?? '', email: user?.email ?? '' })
    form.untouch(CONTACT_FIELDS)
    setEditContact(false)
  }

  function reserve() {
    if (!form.validate(fields)) return
    if (
      !['vehiculo', 'conductor'].includes(v.mode) ||
      !['ida', 'vuelta'].includes(v.trip) ||
      !(WAIT_OPTIONS as readonly string[]).includes(v.wait) ||
      !SERVICE_TYPES[chosen]
    ) {
      toast('Hay una opción no válida en el formulario. Recarga la página.', 'error')
      return
    }
    const f = form.applyFormats(fields)
    const contact = showContact
      ? { name: f.name.trim(), phone: formatPhone(f.phone), email: f.email.trim().toLowerCase() }
      : { name: user!.name, phone: user!.phone, email: user!.email }
    const fq = quote({ mode: f.mode as Mode, trip: f.trip as Trip, distance: f.distance, wait: f.wait, customWait: f.customWait }, config)
    const b: Booking = {
      id: 'RC-' + Date.now().toString(36).toUpperCase(),
      created: new Date().toISOString(),
      service: SERVICE_TYPES[chosen][1],
      mode: f.mode as Mode,
      date: f.date,
      time: f.time.slice(0, 5),
      origin: f.origin.trim(),
      destination: f.destination.trim(),
      trip: f.trip as Trip,
      wait: fq.wait,
      km: fq.km,
      passengers: Number(f.passengers),
      ...contact,
      notes: f.notes.trim(),
      price: fq.total,
      status: 'Pendiente',
      driverId: '',
      vehicleId: '',
      userId: user?.id,
    }
    if (!addBooking(b)) {
      toast('No fue posible guardar la solicitud en este navegador.', 'error')
      return
    }
    onReserved(b)
    toast('Solicitud enviada. Código: ' + b.id, 'success')
  }

  return (
    <section id="book" className={hidden ? 'hidden' : undefined}>
      <div className="layout">
        <div>
          <div className="card">
            <h2>1. ¿Qué servicio necesitas?</h2>
            <div className="servicegrid" role="group" aria-label="Tipo de servicio">
              {SERVICE_TYPES.map(([emo, label], i) => (
                <button
                  key={label}
                  type="button"
                  className={`service${chosen === i ? ' selected' : ''}`}
                  aria-pressed={chosen === i}
                  onClick={() => setChosen(i)}
                >
                  <span className="emo" aria-hidden="true">{emo}</span>
                  <b>{label}</b>
                </button>
              ))}
            </div>
            <h3>¿Cómo quieres viajar?</h3>
            <div className="modegrid" role="radiogroup" aria-label="Modalidad">
              {MODE_OPTIONS.map(o => (
                <button
                  key={o.value}
                  type="button"
                  role="radio"
                  aria-checked={v.mode === o.value}
                  className={`modeopt${v.mode === o.value ? ' selected' : ''}`}
                  onClick={() => form.setValue('mode', o.value)}
                >
                  <span className="emo" aria-hidden="true">{o.emoji}</span>
                  <span>
                    <b>{o.title}</b>
                    <small>{o.desc}</small>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <h2>2. Fecha, lugares y horarios</h2>
            <div className="grid">
              <Field form={form} name="date" label="Fecha del servicio">
                <input type="date" {...form.bind('date')} min={todayISO()} max={addDaysISO(365)} />
              </Field>
              <Field form={form} name="time" label="Hora de recogida">
                <input type="time" {...form.bind('time')} />
              </Field>
            </div>
            <Field form={form} name="origin" label="Lugar de recogida">
              <input {...form.bind('origin')} placeholder="Ej.: Av. Brasil 123, Rancagua" autoComplete="street-address" enterKeyHint="next" />
            </Field>
            <Field form={form} name="destination" label="Destino">
              <input {...form.bind('destination')} placeholder="Ej.: Clínica Alemana, Vitacura, Santiago" enterKeyHint="next" />
            </Field>
            <div className="grid">
              <div className="field">
                <label htmlFor="trip">Tipo de trayecto</label>
                <select {...form.bind('trip')}>
                  <option value="ida">Solo ida</option>
                  <option value="vuelta">Ida y regreso</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="wait">Tiempo de espera solicitado</label>
                <select {...form.bind('wait')}>
                  <option value="0">Sin espera</option>
                  <option value="30">30 minutos</option>
                  <option value="60">1 hora</option>
                  <option value="120">2 horas</option>
                  <option value="180">3 horas</option>
                  <option value="240">4 horas</option>
                  <option value="custom">Personalizado</option>
                </select>
              </div>
            </div>
            {v.wait === 'custom' && (
              <Field form={form} name="customWait" label="Minutos de espera">
                <input type="number" {...form.bind('customWait')} inputMode="numeric" min={1} max={1440} step={1} />
              </Field>
            )}
            <div className="grid">
              <Field form={form} name="distance" label="Kilómetros estimados (solo ida)">
                <input type="number" {...form.bind('distance')} inputMode="numeric" min={1} max={2000} step={1} />
              </Field>
              <Field form={form} name="passengers" label="Pasajeros">
                <input type="number" {...form.bind('passengers')} inputMode="numeric" min={1} max={8} step={1} />
              </Field>
            </div>
            <p className="hint">
              En este prototipo la distancia se ingresa manualmente. La versión conectada a mapas calculará la ruta y
              kilómetros automáticamente.
            </p>
          </div>

          <div className="card">
            <h2>{showContact ? '3. Tus datos y necesidades' : '3. Indicaciones para el viaje'}</h2>
            {!showContact && user && (
              <div className="contactbox">
                <div>
                  <small>Datos de contacto</small>
                  <b>{user.name}</b>
                  <span className="hint">
                    {user.phone}
                    {user.email ? ' · ' + user.email : ''}
                  </span>
                </div>
                <button type="button" className="secondary" onClick={() => setEditContact(true)}>
                  Cambiar
                </button>
              </div>
            )}
            {showContact && hasProfile && (
              <button type="button" className="secondary full" onClick={applyProfileContact} style={{ marginBottom: 14 }}>
                Usar mis datos registrados
              </button>
            )}
            {showContact && (
              <>
                <div className="grid">
                  <Field form={form} name="name" label="Nombre y apellido">
                    <input {...form.bind('name')} placeholder="Ej.: María González" autoComplete="name" autoCapitalize="words" enterKeyHint="next" />
                  </Field>
                  <Field form={form} name="phone" label="Teléfono de contacto">
                    <input type="tel" {...form.bind('phone')} placeholder="+56 9 1234 5678" inputMode="tel" autoComplete="tel" enterKeyHint="next" />
                  </Field>
                </div>
                <Field form={form} name="email" label="Correo electrónico (opcional)">
                  <input
                    type="email"
                    {...form.bind('email')}
                    placeholder="correo@ejemplo.cl"
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="off"
                    spellCheck={false}
                    enterKeyHint="next"
                  />
                </Field>
              </>
            )}
            <Field form={form} name="notes" label="Indicaciones especiales (opcional)">
              <textarea
                {...form.bind('notes')}
                placeholder="Ej.: acompañamiento a recepción, equipaje, movilidad reducida, punto de encuentro, horario estimado de salida..."
              />
            </Field>
          </div>
        </div>

        <aside>
          <div className="card">
            <h2>Resumen de tu cotización</h2>
            <div className="line">
              <span>Tarifa de inicio</span>
              <strong>{money(q.base)}</strong>
            </div>
            <div className="line">
              <span>Kilómetros del servicio</span>
              <strong>{money(q.kmCost)}</strong>
            </div>
            <div className="line">
              <span>Espera solicitada</span>
              <strong>{money(q.waitCost)}</strong>
            </div>
            <div className="line">
              <span>Estimación del trayecto</span>
              <strong>
                {q.km} km · {q.wait} min espera
              </strong>
            </div>
            <p className="hint">Valor referencial del servicio</p>
            <div className="price">{money(q.total)}</div>
            <button type="button" className="primary full" onClick={reserve}>
              Enviar solicitud de reserva
            </button>
            <p className="hint">
              Los campos con <span className="req">*</span> son obligatorios. La solicitud quedará pendiente de
              confirmación. No se realiza cobro en esta demostración.
            </p>
            <div className="notice">
              Tarifas simuladas y configurables. Peajes, estacionamientos, retorno del conductor y otros costos pueden
              requerir confirmación adicional. No constituye oferta definitiva.
            </div>
          </div>
          <div className="card why">
            <h2>¿Por qué elegirnos?</h2>
            <p>✓ Conductores identificados</p>
            <p>✓ Reserva con hora programada</p>
            <p>✓ Acompañamiento y espera</p>
            <p>✓ Seguimiento del estado de solicitud</p>
            <p>✓ Atención cercana y profesional</p>
          </div>
        </aside>
      </div>

      <div className="quotebar">
        <div>
          <small>Total estimado</small>
          <strong>{money(q.total)}</strong>
        </div>
        <button type="button" className="primary" onClick={reserve}>
          Reservar
        </button>
      </div>
    </section>
  )
}
