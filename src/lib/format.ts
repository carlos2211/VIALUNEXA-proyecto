export const money = (n: number) => '$' + Math.round(n).toLocaleString('es-CL')
export const fmtInt = (n: number) => n.toLocaleString('es-CL')

export const todayISO = () => new Date().toLocaleDateString('en-CA')
export const addDaysISO = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toLocaleDateString('en-CA')
}

export function phoneDigits(v: string) {
  let d = String(v || '').replace(/\D/g, '')
  if (d.length === 11 && d.startsWith('56')) d = d.slice(2)
  return d
}

export function formatPhone(v: string) {
  const d = phoneDigits(v)
  return d[0] === '9' ? `+56 9 ${d.slice(1, 5)} ${d.slice(5)}` : '+56 ' + d
}

export const cleanSpaces = (v: string) => v.replace(/\s+/g, ' ').trim()

export function titleCase(v: string) {
  return cleanSpaces(v)
    .split(' ')
    .map(w => (/^(de|del|la|las|los|y)$/i.test(w) ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ')
}

export const sameText = (a: string, b: string) => cleanSpaces(a).toLowerCase() === cleanSpaces(b).toLowerCase()

/** Quita todo lo que no sea parte de un teléfono mientras se escribe */
export const phoneInput = (v: string) => v.replace(/[^\d+\s()\-.]/g, '')
