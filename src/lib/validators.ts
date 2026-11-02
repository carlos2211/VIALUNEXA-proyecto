import { MIN_NOTICE } from './constants'
import { addDaysISO, cleanSpaces, fmtInt, phoneDigits, todayISO } from './format'

const LETTERS = 'A-Za-zÁÉÍÓÚÜÑáéíóúüñ'

export const RX = {
  nameChars: new RegExp(`^[${LETTERS}' \\-]+$`),
  hasWord: new RegExp(`[${LETTERS}]{3,}`),
  hasLetter: new RegExp(`[${LETTERS}]`),
  vehicleName: new RegExp(`^[${LETTERS}0-9][${LETTERS}0-9 .\\-/]*$`),
  email: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/,
  plate: /^([A-Z]{4}\d{2}|[A-Z]{2}\d{4})$/,
  bookingId: /^RC-[A-Z0-9]{6,12}$/,
  unsafe: /[<>{}]/,
}

export function intRule(min: number, max: number, unit = '') {
  return (v: string) => {
    if (!/^\d+$/.test(v)) return 'Ingresa un número entero, sin decimales, puntos ni símbolos.'
    const n = Number(v)
    if (n < min || n > max) return `Debe estar entre ${fmtInt(min)} y ${fmtInt(max)}${unit}.`
    return ''
  }
}

export function moneyRule(v: string) {
  if (!/^\d+$/.test(v)) return 'Ingresa un monto entero, sin puntos, comas ni signo $.'
  if (Number(v) > 1000000) return 'El monto máximo permitido es $1.000.000.'
  return ''
}

export function personName(v: string) {
  if (/\d/.test(v)) return 'El nombre no puede contener números.'
  if (!RX.nameChars.test(v)) return "Solo se permiten letras, espacios, guion (-) y apóstrofo (')."
  const words = cleanSpaces(v).split(' ')
  if (words.length < 2) return 'Ingresa nombre y apellido (ej.: María González).'
  if (words.some(w => w.replace(/['-]/g, '').length < 2)) return 'Cada nombre o apellido debe tener al menos 2 letras.'
  return ''
}

export function safeText(v: string) {
  return RX.unsafe.test(v) ? 'No se permiten los caracteres < > { }.' : ''
}

export function address(v: string) {
  if (RX.unsafe.test(v)) return 'No se permiten los caracteres < > { }.'
  if (!RX.hasWord.test(v)) return 'Ingresa una dirección válida (calle, número y comuna).'
  return ''
}

export function emailCheck(v: string) {
  if (/\s/.test(v)) return 'El correo no puede contener espacios.'
  const at = (v.match(/@/g) || []).length
  if (!at) return 'El correo debe incluir el símbolo @ (ej.: nombre@gmail.com).'
  if (at > 1) return 'El correo solo puede tener un símbolo @.'
  const [local, domain] = v.split('@')
  if (!local) return 'Falta el nombre de usuario antes de @ (ej.: nombre@gmail.com).'
  if (local.length > 64) return 'La parte antes de @ es demasiado larga (máx. 64 caracteres).'
  if (!domain) return 'Falta el dominio después de @ (ej.: gmail.com).'
  if (!domain.includes('.')) return 'El dominio debe incluir un punto (ej.: gmail.com o empresa.cl).'
  if (/\.\./.test(v) || /^\.|\.$/.test(local) || /\.$/.test(domain))
    return 'El correo no puede tener puntos seguidos, ni al inicio o al final.'
  if (!RX.email.test(v)) return 'Formato de correo no válido (ej.: nombre@dominio.cl).'
  return ''
}

export function phoneCheck(v: string) {
  if (!/^[+\d\s()\-.]+$/.test(v)) return 'Solo se permiten números, espacios y el signo +.'
  if (v.slice(1).includes('+')) return 'El signo + solo puede ir al inicio.'
  const raw = v.replace(/\D/g, '')
  const d = phoneDigits(v)
  if (raw.length < 9) return `El teléfono debe tener 9 dígitos (llevas ${raw.length}). Ej.: +56 9 1234 5678.`
  if (d.length !== 9) return 'El teléfono debe tener 9 dígitos, opcionalmente precedidos de +56.'
  if (!/^[2-9]/.test(d)) return 'Número no válido. Los celulares comienzan con 9 (ej.: +56 9 1234 5678).'
  if (/^(\d)\1{8}$/.test(d)) return 'Ingresa un número de teléfono real.'
  return ''
}

export function photoCheck(file: File | null | undefined) {
  if (!file) return ''
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    return 'Formato no permitido. Usa una imagen JPG, PNG o WEBP.'
  if (file.size > 8 * 1024 * 1024) return `La imagen pesa ${(file.size / 1048576).toFixed(1)} MB; el máximo es 8 MB.`
  if (file.size < 1024) return 'El archivo está vacío o dañado.'
  return ''
}

export function dateCheck(v: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || isNaN(new Date(v + 'T00:00').getTime())) return 'Fecha no válida.'
  if (v < todayISO()) return 'La fecha no puede ser anterior a hoy.'
  if (v > addDaysISO(365)) return 'Puedes reservar con un máximo de 12 meses de anticipación.'
  return ''
}

export function timeCheck(v: string, date: string) {
  if (!/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(v)) return 'Hora no válida (formato HH:MM).'
  if (date === todayISO()) {
    const [h, m] = v.split(':').map(Number)
    const now = new Date()
    const min = now.getHours() * 60 + now.getMinutes() + MIN_NOTICE
    if (h * 60 + m < min) {
      if (min >= 1440) return 'Ya no es posible reservar para hoy. Selecciona otra fecha.'
      const hh = String(Math.floor(min / 60)).padStart(2, '0')
      const mm = String(min % 60).padStart(2, '0')
      return `Para hoy, la hora debe ser desde las ${hh}:${mm} (mínimo ${MIN_NOTICE} min de anticipación).`
    }
  }
  return ''
}

export const bookingIdCheck = (v: string) =>
  RX.bookingId.test(v) ? '' : 'Código no válido. Formato: RC- seguido de 6 a 12 letras o números (ej.: RC-M1ABC2DE).'
