import { FleetPhoto, Plate } from '../../components/FleetPhoto'
import { useAppData } from '../../context/AppDataContext'
import { useToast } from '../../context/ToastContext'
import type { FleetEntry } from '../../types'

export function FleetList({ items }: { items: FleetEntry[] }) {
  const { removeFleetEntry } = useAppData()
  const toast = useToast()

  function remove(x: FleetEntry) {
    if (!confirm('¿Eliminar este registro y su fotografía?')) return
    if (removeFleetEntry(x.kind, x.id)) toast('Registro eliminado.', 'success')
    else toast('No fue posible eliminar el registro.', 'error')
  }

  if (!items.length) return <p className="hint">Todavía no hay registros.</p>

  return (
    <div className="fleetgrid">
      {items.map(x => (
        <div key={x.id} className="fleetitem">
          <FleetPhoto entry={x} />
          <div className="fleetinfo">
            <strong>{x.name}</strong>
            <div className="hint">
              <Plate entry={x} />
              {[x.license && 'Licencia ' + x.license, x.year, x.phone, x.detail].filter(Boolean).join(' · ')}
            </div>
            <div className="fleetactions">
              <button type="button" className="secondary" onClick={() => remove(x)}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
