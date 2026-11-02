import type { ReactNode } from 'react'
import { isClosed } from '../lib/constants'
import type { Booking } from '../types'

interface Props {
  bookings: Booking[]
  renderCard: (b: Booking) => ReactNode
  emptyActive: ReactNode
  emptyClosed?: string
}

/** Separa las solicitudes en "En proceso" y "Finalizadas", con indicadores arriba. */
export function BookingBoard({ bookings, renderCard, emptyActive, emptyClosed = 'Aún no hay servicios finalizados.' }: Props) {
  const active = bookings.filter(b => !isClosed(b.status))
  const closed = bookings.filter(b => isClosed(b.status))
  const finished = closed.filter(b => b.status === 'Finalizada').length

  return (
    <>
      <div className="card">
        <div className="kpi">
          <div>
            <span>En proceso</span>
            <strong>{active.length}</strong>
          </div>
          <div>
            <span>Finalizadas</span>
            <strong>{finished}</strong>
          </div>
          <div>
            <span>Canceladas</span>
            <strong>{closed.length - finished}</strong>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>En proceso</h2>
        {active.length ? active.map(renderCard) : <div className="empty">{emptyActive}</div>}
      </div>

      <div className="card">
        <h2>Finalizadas y canceladas</h2>
        {closed.length ? closed.map(renderCard) : <div className="empty">{emptyClosed}</div>}
      </div>
    </>
  )
}
