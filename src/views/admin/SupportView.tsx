import { useState } from 'react'
import { TicketStatusBadge } from '../../components/Support'
import { useAppData } from '../../context/AppDataContext'
import { useToast } from '../../context/ToastContext'
import { TICKET_STATUSES } from '../../lib/constants'
import { safeText } from '../../lib/validators'
import type { SupportTicket, TicketStatus } from '../../types'

type Filter = 'pendientes' | 'todos'

/** Casos de soporte enviados por clientes y conductores */
export function SupportView({ hidden }: { hidden: boolean }) {
  const { tickets, bookings } = useAppData()
  const [filter, setFilter] = useState<Filter>('pendientes')

  const open = tickets.filter(t => t.status !== 'Resuelto')
  const urgent = open.filter(t => t.urgent).length
  // Urgentes primero, luego los más recientes
  const list = (filter === 'pendientes' ? open : tickets).toSorted(
    (a, b) => Number(b.urgent && b.status !== 'Resuelto') - Number(a.urgent && a.status !== 'Resuelto'),
  )

  return (
    <section id="support" className={hidden ? 'hidden' : undefined}>
      <div className="card">
        <h2>Soporte · Reportes de viajes</h2>
        <div className="kpi">
          <div>
            <span>Pendientes</span>
            <strong>{open.length}</strong>
          </div>
          <div>
            <span>Urgentes</span>
            <strong className={urgent ? 'danger-text' : undefined}>{urgent}</strong>
          </div>
          <div>
            <span>Resueltos</span>
            <strong>{tickets.length - open.length}</strong>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="auth-switch light" role="tablist">
          {(['pendientes', 'todos'] as Filter[]).map(f => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={filter === f}
              className={filter === f ? 'active' : undefined}
              onClick={() => setFilter(f)}
            >
              {f === 'pendientes' ? `Pendientes (${open.length})` : `Todos (${tickets.length})`}
            </button>
          ))}
        </div>
        {list.length ? (
          list.map(t => <TicketCard key={t.id} ticket={t} hasBooking={bookings.some(b => b.id === t.bookingId)} />)
        ) : (
          <div className="empty">{filter === 'pendientes' ? 'No hay reportes pendientes. 🎉' : 'Aún no hay reportes.'}</div>
        )}
      </div>
    </section>
  )
}

function TicketCard({ ticket: t, hasBooking }: { ticket: SupportTicket; hasBooking: boolean }) {
  const { updateTicket } = useAppData()
  const toast = useToast()
  const [reply, setReply] = useState(t.reply)
  const replyError = safeText(reply)

  function setStatus(status: TicketStatus) {
    if (updateTicket(t.id, { status })) toast('Reporte marcado como ' + status.toLowerCase(), 'success')
  }

  function saveReply() {
    if (replyError) return toast(replyError, 'error')
    const patch: Partial<SupportTicket> = { reply: reply.trim() }
    if (t.status === 'Abierto' && patch.reply) patch.status = 'En revisión'
    if (updateTicket(t.id, patch)) toast('Respuesta enviada al usuario.', 'success')
    else toast('No fue posible guardar la respuesta.', 'error')
  }

  return (
    <div className={`reservation ticket${t.urgent && t.status !== 'Resuelto' ? ' urgent' : ''}`}>
      <div className="reservation-top">
        <div>
          <strong>
            {t.urgent && t.status !== 'Resuelto' ? '🚨 ' : ''}
            {t.category}
          </strong>
          <div className="hint">
            {t.id} · {new Date(t.created).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })} · Viaje{' '}
            {t.bookingId}
            {hasBooking ? '' : ' (eliminado)'}
          </div>
        </div>
        <TicketStatusBadge ticket={t} />
      </div>
      <p className="hint">
        <span className={`role-tag ${t.role}`}>{t.role === 'conductor' ? 'Conductor' : 'Cliente'}</span> {t.name} ·{' '}
        <a href={`tel:${t.phone.replace(/\s/g, '')}`}>{t.phone}</a>
      </p>
      {t.extra && (
        <div className="line">
          <span>{t.extraLabel || 'Detalle'}</span>
          <strong>{t.extra}</strong>
        </div>
      )}
      <p className="ticket-msg">{t.message}</p>

      <div className="field" style={{ marginTop: 12 }}>
        <label htmlFor={`reply-${t.id}`}>Respuesta para el {t.role === 'conductor' ? 'conductor' : 'cliente'}</label>
        <textarea
          id={`reply-${t.id}`}
          value={reply}
          maxLength={500}
          onChange={e => setReply(e.target.value)}
          placeholder="Ej.: Encontramos tu bolso, te lo llevamos mañana a las 10:00."
          className={replyError ? 'invalid' : undefined}
        />
      </div>
      <div className="actions">
        <button type="button" className="secondary" onClick={saveReply} disabled={reply.trim() === t.reply}>
          Enviar respuesta
        </button>
        {TICKET_STATUSES.filter(s => s !== t.status).map(s => (
          <button key={s} type="button" className="secondary" onClick={() => setStatus(s)}>
            Marcar {s.toLowerCase()}
          </button>
        ))}
      </div>
    </div>
  )
}
