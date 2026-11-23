import { DocButton, ReviewBadge } from '../../components/DocStatus'
import { FleetPhoto, Plate } from '../../components/FleetPhoto'
import { useAppData } from '../../context/AppDataContext'
import { useToast } from '../../context/ToastContext'
import type { Fleet, FleetEntry } from '../../types'

/** Ficha compacta de un conductor o vehículo, con su estado y acciones */
function FleetCell({ entry: x }: { entry: FleetEntry }) {
  const { removeFleetEntry } = useAppData()
  const toast = useToast()

  function remove() {
    const what = x.kind === 'driver' ? 'el conductor' : 'el vehículo'
    if (!confirm(`¿Eliminar ${what} "${x.name}" y su fotografía?`)) return
    if (removeFleetEntry(x.kind, x.id)) toast('Registro eliminado.', 'success')
    else toast('No fue posible eliminar el registro.', 'error')
  }

  return (
    <div className="fleetcell">
      <FleetPhoto entry={x} className="fleetthumb" />
      <div className="fleetinfo">
        <strong>
          {x.name}
          {x.kind === 'vehicle' && x.year ? ' ' + x.year : ''}
        </strong>{' '}
        <ReviewBadge entry={x} />
        {x.review?.status === 'Rechazado' && <div className="hint danger-text">Motivo: {x.review.note}</div>}
        <div className="hint">
          <Plate entry={x} />
          {[x.license && 'Licencia ' + x.license, x.phone, x.detail].filter(Boolean).join(' · ')}
        </div>
        <div className="fleetactions">
          {x.document && <DocButton doc={x.document} />}
          <button type="button" className="secondary" onClick={remove}>
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}

/** Listado de la flota: cada conductor junto al vehículo que registró */
export function FleetList({ fleet }: { fleet: Fleet }) {
  const vehiclesOf = (d: FleetEntry) => (d.userId ? fleet.vehicles.filter(v => v.userId === d.userId) : [])
  const linked = new Set(fleet.drivers.flatMap(d => vehiclesOf(d).map(v => v.id)))
  // Vehículos sin conductor asociado (de la empresa o creados manualmente)
  const loose = fleet.vehicles.filter(v => !linked.has(v.id))

  if (!fleet.drivers.length && !fleet.vehicles.length) return <p className="hint">Todavía no hay registros.</p>

  return (
    <div className="fleetlist" role="table" aria-label="Conductores y sus vehículos">
      <div className="fleetrow fleethead" role="row">
        <span role="columnheader">Conductor</span>
        <span role="columnheader">Vehículo registrado</span>
      </div>
      {fleet.drivers.map(d => {
        const own = vehiclesOf(d)
        return (
          <div key={d.id} className="fleetrow" role="row">
            <div role="cell">
              <FleetCell entry={d} />
            </div>
            <div role="cell" className="fleetvehicles">
              {own.length ? (
                own.map(v => <FleetCell key={v.id} entry={v} />)
              ) : (
                <div className="fleetempty">Sin vehículo registrado</div>
              )}
            </div>
          </div>
        )
      })}
      {loose.map(v => (
        <div key={v.id} className="fleetrow" role="row">
          <div role="cell">
            <div className="fleetempty">🏢 Vehículo de la empresa (sin conductor asociado)</div>
          </div>
          <div role="cell" className="fleetvehicles">
            <FleetCell entry={v} />
          </div>
        </div>
      ))}
    </div>
  )
}
