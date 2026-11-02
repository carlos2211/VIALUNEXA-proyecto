import { BookingBoard } from '../../components/BookingBoard'
import { BookingCard } from '../../components/BookingCard'
import { SupportButton } from '../../components/Support'
import { useAppData } from '../../context/AppDataContext'
import { useToast } from '../../context/ToastContext'
import { isClosed } from '../../lib/constants'
import type { Booking, BookingStatus } from '../../types'
import { useMyFleet } from '../../hooks/useMyFleet'

/** Siguiente paso que puede marcar el conductor */
const NEXT: Partial<Record<BookingStatus, BookingStatus>> = { Confirmada: 'En curso', 'En curso': 'Finalizada' }

export function DriverServicesView({ hidden, onCompleteProfile }: { hidden: boolean; onCompleteProfile: () => void }) {
  const { bookings, fleet, updateBooking } = useAppData()
  const { driver } = useMyFleet()
  const toast = useToast()

  if (!driver)
    return (
      <section id="services" className={hidden ? 'hidden' : undefined}>
        <div className="card">
          <h2>Mis servicios</h2>
          <div className="empty">Completa tus datos de conductor para que el equipo pueda asignarte servicios.</div>
          <button type="button" className="primary full" onClick={onCompleteProfile}>
            Completar mis datos
          </button>
        </div>
      </section>
    )

  const mine = bookings.filter(b => b.driverId === driver.id)

  function advance(b: Booking, status: BookingStatus) {
    if (updateBooking(b.id, { status })) toast('Estado actualizado: ' + status, 'success')
    else toast('No fue posible actualizar el estado.', 'error')
  }

  return (
    <section id="services" className={hidden ? 'hidden' : undefined}>
      <BookingBoard
        bookings={mine}
        emptyActive="No tienes servicios asignados por ahora."
        renderCard={b => {
          const next = NEXT[b.status]
          return (
            <BookingCard key={b.id} booking={b} fleet={fleet}>
              {!isClosed(b.status) && (
                <>
                  <p className="hint">
                    Pasajero: {b.name} · {b.phone} · {b.passengers} pasajero(s)
                  </p>
                  <p className="hint">Notas: {b.notes || 'Sin indicaciones'}</p>
                </>
              )}
              {next && (
                <button type="button" className="primary full" onClick={() => advance(b, next)}>
                  Marcar como {next.toLowerCase()}
                </button>
              )}
              <SupportButton booking={b} />
            </BookingCard>
          )
        }}
      />
    </section>
  )
}
