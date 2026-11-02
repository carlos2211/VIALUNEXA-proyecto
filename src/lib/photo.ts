import { photoCheck } from './validators'

/** Reduce la imagen a máx. 620px y la devuelve como data URL JPEG. */
export async function compressPhoto(file: File | null | undefined): Promise<string> {
  if (!file) return ''
  const err = photoCheck(file)
  if (err) throw Error(err)
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    await new Promise<void>((ok, no) => {
      img.onload = () => ok()
      img.onerror = () => no(Error('No se pudo leer la imagen.'))
      img.src = url
    })
    const max = 620
    const scale = Math.min(1, max / Math.max(img.width, img.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(img.width * scale))
    canvas.height = Math.max(1, Math.round(img.height * scale))
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.72)
  } finally {
    URL.revokeObjectURL(url)
  }
}
