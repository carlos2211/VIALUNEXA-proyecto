import type { FleetDoc, FleetEntry, FleetKind, Review } from '../types'
import { compressPhoto } from './photo'

/**
 * Documentos de la flota: licencia de conducir (conductor) y permiso de circulación (vehículo).
 * En este prototipo se guardan en el navegador; con backend deberían ir a un almacenamiento
 * de archivos (p. ej. S3) con acceso solo para el administrador.
 */

export const DOC_LABEL: Record<FleetKind, string> = {
  driver: 'Licencia de conducir',
  vehicle: 'Permiso de circulación',
}

export const DOC_ACCEPT = 'image/jpeg,image/png,image/webp,application/pdf'
export const DOC_HINT = 'Foto legible (JPG, PNG, WEBP) de hasta 8 MB, o PDF de hasta 1 MB.'

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_IMAGE = 8 * 1024 * 1024
/** Los PDF no se pueden comprimir en el navegador y el espacio local es limitado */
const MAX_PDF = 1024 * 1024

export function docCheck(file: File | null | undefined) {
  if (!file) return ''
  if (file.size < 1024) return 'El archivo está vacío o dañado.'
  if (file.type === 'application/pdf')
    return file.size > MAX_PDF ? `El PDF pesa ${(file.size / 1048576).toFixed(1)} MB; el máximo es 1 MB. Prueba con una foto.` : ''
  if (!IMAGE_TYPES.includes(file.type)) return 'Formato no permitido. Usa una foto (JPG, PNG, WEBP) o un PDF.'
  if (file.size > MAX_IMAGE) return `La imagen pesa ${(file.size / 1048576).toFixed(1)} MB; el máximo es 8 MB.`
  return ''
}

/** Regla para el campo de archivo: obligatorio solo si el registro aún no tiene documento */
export const docRule = (kind: FleetKind, current?: FleetDoc) => (file: File | null) =>
  !file && !current ? `Adjunta tu ${DOC_LABEL[kind].toLowerCase()}.` : docCheck(file)

const readDataUrl = (file: File) =>
  new Promise<string>((ok, no) => {
    const r = new FileReader()
    r.onload = () => ok(String(r.result))
    r.onerror = () => no(Error('No se pudo leer el archivo.'))
    r.readAsDataURL(file)
  })

export async function readDocument(file: File): Promise<FleetDoc> {
  const err = docCheck(file)
  if (err) throw Error(err)
  const isPdf = file.type === 'application/pdf'
  // Más resolución que las fotos de perfil para que se lean los datos del documento
  const data = isPdf ? await readDataUrl(file) : await compressPhoto(file, { max: 1600, quality: 0.8, check: docCheck })
  return { data, name: file.name, type: isPdf ? 'application/pdf' : 'image/jpeg', uploaded: new Date().toISOString() }
}

export type DocStatus = Review['status'] | 'Sin documento'

/**
 * Estado de revisión. Los registros creados por el administrador (sin cuenta de conductor)
 * y anteriores a esta función se consideran aprobados.
 */
export function docStatus(entry: FleetEntry): DocStatus {
  if (entry.review) return entry.review.status
  if (!entry.userId) return 'Aprobado'
  return entry.document ? 'Pendiente' : 'Sin documento'
}

export const isApproved = (entry: FleetEntry | undefined) => !!entry && docStatus(entry) === 'Aprobado'

export const pendingReview = (entry: FleetEntry) => docStatus(entry) === 'Pendiente'

export const newReview = (status: Review['status'], note = ''): Review => ({ status, note, date: new Date().toISOString() })

/** Abre el documento en una pestaña nueva (imagen o PDF) */
export function openDocument(doc: FleetDoc) {
  // La ventana se abre antes de cualquier espera para que el navegador no la bloquee
  const win = window.open('', '_blank')
  fetch(doc.data)
    .then(r => r.blob())
    .then(blob => {
      const url = URL.createObjectURL(blob)
      if (win) win.location.href = url
      else window.location.assign(url)
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    })
    .catch(() => win?.close())
}
