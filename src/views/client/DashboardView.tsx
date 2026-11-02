import { BookingBoard } from '../../components/BookingBoard'
import { BookingCard } from '../../components/BookingCard'
import { SupportButton } from '../../components/Support'
import { useAppData } from '../../context/AppDataContext'
import { useAuth } from '../../context/AuthContext'

interface Props {
  hidden: boolean
  /** Código de la reserva recién creada, para destacarla */
  justCreated: string
  onNew: () => void
}

export function DashboardView({ hidden, justCreated, onNew }: Props) {
  const { bookings, fleet } = useAppData()
  const { user } = useAuth()
  const mine = bookings.filter(b => b.userId === user?.id)

  return (
    <section id="dashboard" className={hidden ? 'hidden' : undefined}>
      <div className="card">
        <h2>Hola, {user?.name.split(' ')[0]} 👋</h2>
        {justCreated && mine.some(b => b.id === justCreated) ? (
          <div className="success-box">
            ✅ Solicitud enviada. Quedará pendiente hasta que la confirmemos. Código de tu reserva:
            <code>{justCreated}</code>
          </div>
        ) : (
          <p className="hint">Aquí puedes seguir el estado de tus solicitudes y ver el conductor asignado.</p>
        )}
        <button type="button" className="primary full" onClick={onNew}>
          Cotizar un nuevo viaje
        </button>
      </div>

      <BookingBoard
        bookings={mine}
        renderCard={b => (
          <BookingCard key={b.id} booking={b} fleet={fleet}>
            <SupportButton booking={b} />
          </BookingCard>
        )}
        emptyActive="No tienes solicitudes en proceso."
      />
    </section>
  )
}
