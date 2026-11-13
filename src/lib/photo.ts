import { photoCheck } from './validators'

interface CompressOptions {
  /** Lado mayor en píxeles */
  max?: number
  quality?: number
  check?: (file: File) => string
}

/** Reduce la imagen (por defecto a máx. 620px) y la devuelve como data URL JPEG. */
export async function compressPhoto(
  file: File | null | undefined,
  { max = 620, quality = 0.72, check = photoCheck }: CompressOptions = {},
): Promise<string> {
  if (!file) return ''
  const err = check(file)
  if (err) throw Error(err)
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    await new Promise<void>((ok, no) => {
      img.onload = () => ok()
      img.onerror = () => no(Error('No se pudo leer la imagen.'))
      img.src = url
    })
    const scale = Math.min(1, max / Math.max(img.width, img.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(img.width * scale))
    canvas.height = Math.max(1, Math.round(img.height * scale))
    const ctx = canvas.getContext('2d')!
    // Fondo blanco: los PNG con transparencia no quedan negros al pasar a JPEG
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', quality)
  } finally {
    URL.revokeObjectURL(url)
  }
}
