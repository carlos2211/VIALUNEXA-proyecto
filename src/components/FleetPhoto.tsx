import type { FleetEntry } from '../types'

export function FleetPhoto({ entry, className = 'fleetphoto' }: { entry: FleetEntry; className?: string }) {
  if (entry.photo) return <img className={className} src={entry.photo} alt={`Fotografía de ${entry.name}`} />
  return <div className="photo-placeholder">{entry.kind === 'vehicle' ? '🚘' : '👤'}</div>
}

export function Plate({ entry }: { entry: FleetEntry }) {
  if (!entry.plate) return null
  return (
    <>
      <span className="plate">{entry.plate}</span>{' '}
    </>
  )
}
