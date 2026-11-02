import { useState } from 'react'
import type { Booking, Fleet, FleetEntry } from '../types'
import { FleetPhoto, Plate } from './FleetPhoto'

const findById = (list: FleetEntry[], id: string) => list.find(x => x.id === id)

/** Vehículo registrado por el propio conductor (si tiene cuenta) */
const vehicleOf = (fleet: Fleet, driver: FleetEntry | undefined) =>
  driver?.userId ? fleet.vehicles.find(v => v.userId === driver.userId) : undefined

export function AssignmentSummary({ booking, fleet }: { booking: Booking; fleet: Fleet }) {
  const driver = findById(fleet.drivers, booking.driverId)
  // Si no se asignó un vehículo explícito, se muestra el del conductor
  const vehicle = findById(fleet.vehicles, booking.vehicleId) ?? vehicleOf(fleet, driver)
  if (!driver && !vehicle) return null

  return (
    <div className="assignment">
      <b>Servicio asignado</b>
      {driver && (
        <div className="profile">
          <FleetPhoto entry={driver} />
          <div>
            <b>Conductor: {driver.name}</b>
            <span className="hint">{driver.detail}</span>
          </div>
        </div>
      )}
      {booking.mode === 'conductor' ? (
        <div className="profile">
          <div className="photo-placeholder">🔑</div>
          <div>
            <b>Vehículo: el tuyo</b>
            <span className="hint">El conductor manejará tu propio automóvil.</span>
          </div>
        </div>
      ) : !vehicle ? (
        <div className="profile">
          <div className="photo-placeholder">🚘</div>
          <div>
            <b>Vehículo: por confirmar</b>
            <span className="hint">Te informaremos la marca, modelo y patente antes del viaje.</span>
          </div>
        </div>
      ) : (
        <div className="profile">
          <FleetPhoto entry={vehicle} />
          <div>
            <b>
              Vehículo: {vehicle.name}
              {vehicle.year ? ' · ' + vehicle.year : ''}
            </b>
            <span className="hint">
              Patente <Plate entry={vehicle} />
              {vehicle.detail}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

interface EditorProps {
  booking: Booking
  fleet: Fleet
  onSave: (driverId: string, vehicleId: string) => void
}

export function AssignmentEditor({ booking, fleet, onSave }: EditorProps) {
  const [driverId, setDriverId] = useState(booking.driverId)
  const [vehicleId, setVehicleId] = useState(booking.vehicleId)
  const withVehicle = booking.mode === 'vehiculo'

  const options = (items: FleetEntry[]) => (
    <>
      <option value="">Sin asignar</option>
      {items.map(x => (
        <option key={x.id} value={x.id}>
          {x.name}
          {x.plate ? ' · ' + x.plate : ''}
        </option>
      ))}
    </>
  )

  return (
    <div className="assignment">
      <b>Asignación del servicio</b>
      <div className="grid" style={{ marginTop: 10 }}>
        <div className="field">
          <label htmlFor={`d-${booking.id}`}>Conductor</label>
          <select
            id={`d-${booking.id}`}
            value={driverId}
            onChange={e => {
              setDriverId(e.target.value)
              // Propone el vehículo del conductor elegido
              const own = vehicleOf(fleet, findById(fleet.drivers, e.target.value))
              if (own) setVehicleId(own.id)
            }}
          >
            {options(fleet.drivers)}
          </select>
        </div>
        {withVehicle && (
          <div className="field">
            <label htmlFor={`v-${booking.id}`}>Vehículo</label>
            <select id={`v-${booking.id}`} value={vehicleId} onChange={e => setVehicleId(e.target.value)}>
              {options(fleet.vehicles)}
            </select>
          </div>
        )}
      </div>
      <button type="button" className="secondary" onClick={() => onSave(driverId, withVehicle ? vehicleId : '')}>
        Guardar asignación
      </button>
    </div>
  )
}
