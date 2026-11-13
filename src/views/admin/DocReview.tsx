import { useState } from 'react'
import { DocButton } from '../../components/DocStatus'
import { FleetPhoto, Plate } from '../../components/FleetPhoto'
import { useAppData } from '../../context/AppDataContext'
import { useToast } from '../../context/ToastContext'
import { DOC_LABEL, newReview, openDocument, pendingReview } from '../../lib/documents'
import { safeText } from '../../lib/validators'
import type { FleetEntry } from '../../types'

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

function ReviewItem({ entry }: { entry: FleetEntry }) {
  const { fleet, saveFleetEntry } = useAppData()
  const toast = useToast()
  const [rejecting, setRejecting] = useState(false)
  const [note, setNote] = useState('')
  const doc = entry.document!
  // Dueño del registro: para un vehículo se muestra el conductor que lo inscribió
  const owner = entry.kind === 'vehicle' ? fleet.drivers.find(d => d.userId === entry.userId) : undefined
  const noteError = rejecting ? (note.trim().length < 5 ? 'Explica el motivo (mín. 5 caracteres).' : safeText(note)) : ''

  function decide(approve: boolean) {
    if (!approve && noteError) return
    const review = approve ? newReview('Aprobado') : newReview('Rechazado', note.trim())
    if (!saveFleetEntry({ ...entry, review })) return toast('No fue posible guardar la revisión.', 'error')
    toast(approve ? `${DOC_LABEL[entry.kind]} aprobado.` : 'Documento rechazado; el conductor verá el motivo.', 'success')
  }

  return (
    <div className="reviewitem">
      <div className="profile">
        <FleetPhoto entry={entry} />
        <div>
          <b>
            {entry.kind === 'driver' ? '👤 ' : '🚘 '}
            {entry.name}
            {entry.year ? ' ' + entry.year : ''}
          </b>
          <span className="hint">
            <Plate entry={entry} />
            {entry.kind === 'driver'
              ? [entry.license && 'Licencia clase ' + entry.license, entry.phone].filter(Boolean).join(' · ')
              : owner
                ? 'Conductor: ' + owner.name
                : ''}
          </span>
          <span className="hint">
            {DOC_LABEL[entry.kind]} · enviado el {fmtDate(doc.uploaded)}
          </span>
        </div>
      </div>

      {doc.type !== 'application/pdf' && (
        <button type="button" className="docthumb" onClick={() => openDocument(doc)} aria-label="Abrir documento en tamaño completo">
          <img src={doc.data} alt={`${DOC_LABEL[entry.kind]} de ${entry.name}`} />
        </button>
      )}

      {rejecting && (
        <div className="field">
          <label htmlFor={`note-${entry.id}`}>Motivo del rechazo (lo verá el conductor)</label>
          <textarea
            id={`note-${entry.id}`}
            value={note}
            maxLength={200}
            onChange={e => setNote(e.target.value)}
            placeholder="Ej.: la foto está borrosa / el permiso está vencido / la clase no coincide"
            className={noteError && note ? 'invalid' : undefined}
          />
          {noteError && note && <div className="error-msg">{noteError}</div>}
        </div>
      )}

      <div className="fleetactions">
        <DocButton doc={doc} />
        {rejecting ? (
          <>
            <button type="button" className="danger" onClick={() => decide(false)} disabled={!!noteError}>
              Confirmar rechazo
            </button>
            <button type="button" className="secondary" onClick={() => setRejecting(false)}>
              Cancelar
            </button>
          </>
        ) : (
          <>
            <button type="button" className="primary" onClick={() => decide(true)}>
              ✓ Aprobar
            </button>
            <button type="button" className="secondary" onClick={() => setRejecting(true)}>
              ✕ Rechazar
            </button>
          </>
        )}
      </div>
    </div>
  )
}

/** Documentos enviados por conductores que esperan la revisión del administrador */
export function DocReview() {
  const { fleet } = useAppData()
  const pending = [...fleet.drivers, ...fleet.vehicles].filter(pendingReview)

  return (
    <div className="card">
      <h2>Documentos por revisar {pending.length > 0 && <span className="status doc-pending">{pending.length}</span>}</h2>
      <p className="hint">
        Un conductor solo puede recibir servicios cuando su licencia está aprobada, y su vehículo solo se puede asignar
        con el permiso de circulación aprobado.
      </p>
      {pending.length ? (
        <div className="reviewgrid">
          {pending.map(x => (
            <ReviewItem key={x.id} entry={x} />
          ))}
        </div>
      ) : (
        <div className="empty">No hay documentos pendientes. 🎉</div>
      )}
    </div>
  )
}
