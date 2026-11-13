import { BookingCard } from '../components/BookingCard'
import { useAppData } from '../context/AppDataContext'
import { useToast } from '../context/ToastContext'
import { isApproved } from '../lib/documents'
import type { Booking, BookingStatus, FleetEntry } from '../types'
import { DocReview } from './admin/DocReview'
import { DriverForm, VehicleForm } from './admin/FleetForm'
import { FleetList } from './admin/FleetList'
import { RatesForm } from './admin/RatesForm'

/** Solicitudes recibidas: estado y asignación de conductor/vehículo */
export function AdminView({ hidden }: { hidden: boolean }) {
  const { bookings, fleet, updateBooking } = useAppData()
  const toast = useToast()

  const pending = bookings.filter(b => b.status === 'Pendiente').length
  const confirmed = bookings.filter(b => b.status === 'Confirmada').length

  function setStatus(b: Booking, status: BookingStatus) {
    if (updateBooking(b.id, { status })) toast('Estado actualizado: ' + status, 'success')
  }

  function assign(b: Booking, driverId: string, vehicleId: string) {
    const unapproved = (id: string, current: string, list: FleetEntry[]) =>
      !!id && id !== current && !isApproved(list.find(x => x.id === id))
    if (unapproved(driverId, b.driverId, fleet.drivers) || unapproved(vehicleId, b.vehicleId, fleet.vehicles)) {
      toast('Ese conductor o vehículo aún no tiene sus documentos aprobados.', 'error')
      return
    }
    if (['Confirmada', 'En curso'].includes(b.status) && !driverId)
      toast('Una reserva confirmada o en curso debería tener un conductor asignado.', 'error')
    if (updateBooking(b.id, { driverId, vehicleId })) toast('Asignación guardada.', 'success')
    else toast('No fue posible guardar la asignación.', 'error')
  }

  return (
    <section id="admin" className={hidden ? 'hidden' : undefined}>
      <div className="card">
        <h2>Panel de gestión de reservas</h2>
        <div className="kpi">
          <div>
            <span>Solicitudes</span>
            <strong>{bookings.length}</strong>
          </div>
          <div>
            <span>Pendientes</span>
            <strong>{pending}</strong>
          </div>
          <div>
            <span>Confirmadas</span>
            <strong>{confirmed}</strong>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Solicitudes recibidas</h2>
        {bookings.length ? (
          bookings.map(b => (
            <BookingCard
              key={b.id}
              booking={b}
              fleet={fleet}
              admin={{ onStatus: s => setStatus(b, s), onAssign: (d, v) => assign(b, d, v) }}
            />
          ))
        ) : (
          <div className="empty">Aún no hay reservas.</div>
        )}
      </div>
    </section>
  )
}

export function FleetView({ hidden }: { hidden: boolean }) {
  const { fleet } = useAppData()

  return (
    <section id="fleet" className={hidden ? 'hidden' : undefined}>
      <DocReview />
      <div className="card">
        <h2>Conductores y vehículos</h2>
        <p className="hint">
          Cada conductor registra sus propios datos, vehículo y documentos desde su cuenta; aquí los revisas y
          administras.
        </p>
        <h3>Conductores registrados ({fleet.drivers.length})</h3>
        <FleetList items={fleet.drivers} />
        <h3>Vehículos registrados ({fleet.vehicles.length})</h3>
        <FleetList items={fleet.vehicles} />
      </div>

      {/* Uso excepcional: cerrado por defecto (el contenido se mantiene al cerrar) */}
      <details className="card collapsible">
        <summary>
          <span>
            <b>Registrar manualmente</b>
            <small className="hint">Solo si un conductor no puede hacerlo desde su cuenta</small>
          </span>
        </summary>
        <p className="hint">
          Los registros creados aquí quedan aprobados automáticamente. Las imágenes se reducen de tamaño y se guardan
          únicamente en este navegador.
        </p>
        <div className="grid">
          <DriverForm />
          <VehicleForm />
        </div>
      </details>
    </section>
  )
}

export function RatesView({ hidden }: { hidden: boolean }) {
  return (
    <section id="rates" className={hidden ? 'hidden' : undefined}>
      <RatesForm active={!hidden} />
    </section>
  )
}
