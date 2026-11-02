import { useEffect, useRef, useState } from 'react'
import { useAppData } from '../context/AppDataContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useForm, type Rules } from '../hooks/useForm'
import { SUPPORT_CATEGORIES } from '../lib/constants'
import { cleanSpaces } from '../lib/format'
import { safeText } from '../lib/validators'
import type { Booking, SupportTicket } from '../types'
import { Field } from './Field'

export function TicketStatusBadge({ ticket }: { ticket: SupportTicket }) {
  const cls = ticket.status === 'Resuelto' ? 'finalizada' : ticket.status === 'En revisión' ? 'en-curso' : ''
  return <span className={`status ${cls}`}>{ticket.status}</span>
}

/** Botón de soporte de un viaje, con los casos ya reportados por el usuario conectado. */
export function SupportButton({ booking }: { booking: Booking }) {
  const { tickets } = useAppData()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  if (!user || user.role === 'admin') return null

  const mine = tickets.filter(t => t.bookingId === booking.id && t.userId === user.id)

  return (
    <div className="support">
      {mine.map(t => (
        <div key={t.id} className="ticket-mini">
          <div className="ticket-head">
            <b>
              🛟 {t.category}
              {t.urgent ? ' · Urgente' : ''}
            </b>
            <TicketStatusBadge ticket={t} />
          </div>
          {t.reply ? (
            <p className="hint">
              <b>Respuesta de soporte:</b> {t.reply}
            </p>
          ) : (
            <p className="hint">Recibimos tu reporte. Te contactaremos a la brevedad.</p>
          )}
        </div>
      ))}
      <button type="button" className="support-btn" onClick={() => setOpen(true)}>
        <span aria-hidden="true">🛟</span> {mine.length ? 'Reportar otro problema' : 'Soporte · Reportar un problema'}
      </button>
      {open && <SupportDialog booking={booking} onClose={() => setOpen(false)} />}
    </div>
  )
}

/** Código y fecha de un reporte nuevo */
const stamp = () => ({ id: 'SP-' + Date.now().toString(36).toUpperCase(), created: new Date().toISOString() })

type SupportKey = 'category' | 'extra' | 'message'
const FIELDS: SupportKey[] = ['category', 'extra', 'message']

function SupportDialog({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const { addTicket } = useAppData()
  const { user } = useAuth()
  const toast = useToast()
  const ref = useRef<HTMLDialogElement>(null)
  const [urgent, setUrgent] = useState(false)
  const role = user?.role === 'conductor' ? 'conductor' : 'cliente'
  const categories = SUPPORT_CATEGORIES[role]
  const extraOf = (label: string) => categories.find(c => c.label === label)?.extra

  const rules: Rules<SupportKey> = {
    category: { required: true },
    extra: { required: true, maxLen: 150, when: all => !!extraOf(all.category), format: cleanSpaces, check: safeText },
    message: { required: true, minLen: 10, maxLen: 800, counter: true, check: safeText },
  }
  const form = useForm(rules, { category: '', extra: '', message: '' })
  const extra = extraOf(form.values.category)
  const categoryProps = form.bind('category')

  useEffect(() => {
    ref.current?.showModal()
  }, [])

  function send() {
    if (!user || !form.validate(FIELDS)) return
    const f = form.applyFormats(FIELDS)
    const t: SupportTicket = {
      ...stamp(),
      bookingId: booking.id,
      userId: user.id,
      role,
      name: user.name,
      phone: user.phone,
      category: f.category,
      urgent,
      message: f.message.trim(),
      extra: extra ? f.extra.trim() : '',
      extraLabel: extra?.label ?? '',
      status: 'Abierto',
      reply: '',
    }
    if (!addTicket(t)) {
      toast('No fue posible enviar el reporte.', 'error')
      return
    }
    toast('Reporte enviado. El equipo de soporte ya lo recibió.', 'success')
    onClose()
  }

  return (
    <dialog ref={ref} className="modal" onClose={onClose} aria-labelledby={`sp-${booking.id}`}>
      <div className="modal-head">
        <div>
          <h2 id={`sp-${booking.id}`}>🛟 Soporte del viaje</h2>
          <p className="hint">
            {booking.id} · {booking.date} {booking.time}
            <br />
            {booking.origin} → {booking.destination}
          </p>
        </div>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">
          ✕
        </button>
      </div>

      <Field form={form} name="category" label={role === 'conductor' ? '¿Qué ocurrió en el servicio?' : '¿En qué te ayudamos?'}>
        <select
          {...categoryProps}
          onChange={e => {
            categoryProps.onChange(e)
            // La pregunta adicional depende del motivo: se limpia al cambiarlo
            form.setValue('extra', '')
            form.untouch(['extra'])
          }}
        >
          <option value="">Selecciona un motivo…</option>
          {categories.map(c => (
            <option key={c.label} value={c.label}>
              {c.label}
            </option>
          ))}
        </select>
      </Field>

      {extra && (
        <Field form={form} name="extra" label={extra.label}>
          {extra.options ? (
            <select {...form.bind('extra')}>
              <option value="">Selecciona…</option>
              {extra.options.map(o => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          ) : (
            <input {...form.bind('extra')} placeholder={extra.placeholder} />
          )}
        </Field>
      )}

      <Field form={form} name="message" label="Cuéntanos qué pasó">
        <textarea
          {...form.bind('message')}
          placeholder={
            role === 'conductor'
              ? 'Ej.: se encendió la luz de motor en Av. Kennedy, me detuve en un lugar seguro…'
              : 'Ej.: dejé mi bolso en el asiento trasero al bajar en el destino…'
          }
        />
      </Field>

      <label className="check">
        <input type="checkbox" checked={urgent} onChange={e => setUrgent(e.target.checked)} />
        Es urgente, necesito que me contacten ahora
      </label>
      {urgent && (
        <div className="notice" style={{ marginBottom: 14 }}>
          Te llamaremos al {user?.phone}. Si hay personas heridas o riesgo inmediato, llama primero al 131 (ambulancia)
          o 133 (Carabineros).
        </div>
      )}

      <div className="modal-actions">
        <button type="button" className="secondary" onClick={onClose}>
          Cancelar
        </button>
        <button type="button" className="primary" onClick={send}>
          Enviar reporte
        </button>
      </div>
    </dialog>
  )
}
