import { DOC_LABEL, docStatus, openDocument, type DocStatus } from '../lib/documents'
import type { FleetDoc, FleetEntry } from '../types'

const BADGE: Record<DocStatus, { cls: string; text: string }> = {
  Aprobado: { cls: 'doc-ok', text: '✓ Aprobado' },
  Pendiente: { cls: 'doc-pending', text: '⏳ En revisión' },
  Rechazado: { cls: 'doc-bad', text: '✕ Rechazado' },
  'Sin documento': { cls: 'doc-missing', text: '! Falta documento' },
}

export function ReviewBadge({ entry }: { entry: FleetEntry }) {
  const b = BADGE[docStatus(entry)]
  return <span className={`status ${b.cls}`}>{b.text}</span>
}

export function DocButton({ doc, label = 'Ver documento' }: { doc: FleetDoc; label?: string }) {
  return (
    <button type="button" className="secondary" onClick={() => openDocument(doc)}>
      {doc.type === 'application/pdf' ? '📄' : '🖼️'} {label}
    </button>
  )
}

/** Estado del documento para el propio conductor, con el motivo si fue rechazado */
export function DocStatusBox({ entry }: { entry: FleetEntry }) {
  const status = docStatus(entry)
  const label = DOC_LABEL[entry.kind]
  return (
    <div className={`docbox ${BADGE[status].cls}`}>
      <div>
        <b>{label}</b> <ReviewBadge entry={entry} />
        <span className="hint">
          {status === 'Aprobado' && 'Documento verificado por el equipo VIALUNEXA.'}
          {status === 'Pendiente' && 'El equipo está revisando tu documento. Te avisaremos aquí cuando esté aprobado.'}
          {status === 'Rechazado' && <>Motivo: {entry.review?.note || 'sin detalle'}. Sube un documento nuevo y guarda.</>}
          {status === 'Sin documento' && `Adjunta tu ${label.toLowerCase()} para que podamos aprobarte.`}
        </span>
      </div>
      {entry.document && <DocButton doc={entry.document} label="Ver" />}
    </div>
  )
}
