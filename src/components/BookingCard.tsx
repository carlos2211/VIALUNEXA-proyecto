import type { ReactNode } from 'react'
import { ALL_STATUSES, modeLabel, STAGES } from '../lib/constants'
import { money } from '../lib/format'
import type { Booking, BookingStatus, Fleet } from '../types'
import { AssignmentEditor, AssignmentSummary } from './Assignment'

interface AdminActions {
  onStatus: (status: BookingStatus) => void
  onAssign: (driverId: string, vehicleId: string) => void
}

interface Props {
  booking: Booking
  fleet: Fleet
  /** Si se entrega, la tarjeta muestra datos del cliente y acciones de administración */
  admin?: AdminActions
  /** Contenido adicional al final de la tarjeta (p. ej. acciones del conductor) */
  children?: ReactNode
}

export function BookingCard({ booking: b, fleet, admin, children }: Props) {
  const statusClass = b.status.toLowerCase().replace(' ', '-')
  const stageIndex = STAGES.indexOf(b.status)

  return (
    <div className="reservation">
      <div className="reservation-top">
        <div>
          <strong>{b.id}</strong>
          <div className="hint">
            {b.service} · {modeLabel(b.mode)}
          </div>
        </div>
        <span className={`status ${statusClass}`}>{b.status}</span>
      </div>
      <div className="steps">
        {b.status === 'Cancelada' ? (
          <span className="step">Solicitud cancelada</span>
        ) : (
          STAGES.map((s, i) => (
            <span key={s} className={`step${i <= stageIndex ? ' done' : ''}`}>
              {s}
            </span>
          ))
        )}
      </div>
      <p>
        <b>{b.origin}</b> → <b>{b.destination}</b>
      </p>
      <div className="line">
        <span>Fecha y hora</span>
        <strong>
          {b.date} · {b.time}
        </strong>
      </div>
      <div className="line">
        <span>Trayecto y espera</span>
        <strong>
          {b.km} km · {b.wait} min
        </strong>
      </div>
      <div className="line">
        <span>Cotización referencial</span>
        <strong>{money(b.price)}</strong>
      </div>
      <AssignmentSummary booking={b} fleet={fleet} />
      {admin && (
        <>
          <p className="hint">
            Cliente: {b.name} · {b.phone}
            {b.email ? ' · ' + b.email : ''}
          </p>
          <p className="hint">Notas: {b.notes || 'Sin indicaciones'}</p>
          <div className="actions">
            <AssignmentEditor booking={b} fleet={fleet} onSave={admin.onAssign} />
            {ALL_STATUSES.map(s => (
              <button key={s} type="button" className="secondary" onClick={() => admin.onStatus(s)}>
                {s}
              </button>
            ))}
          </div>
        </>
      )}
      {children}
    </div>
  )
}
