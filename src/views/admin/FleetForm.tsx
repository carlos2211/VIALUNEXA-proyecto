import { Field } from '../../components/Field'
import { useAppData } from '../../context/AppDataContext'
import { useToast } from '../../context/ToastContext'
import { useForm, type Rules } from '../../hooks/useForm'
import { cleanSpaces, sameText, titleCase } from '../../lib/format'
import { DOC_ACCEPT, DOC_HINT, docRule, newReview, readDocument } from '../../lib/documents'
import { compressPhoto } from '../../lib/photo'
import { personName, photoCheck, RX, safeText } from '../../lib/validators'
import type { FleetEntry } from '../../types'

const FILE_HINT = <div className="filehint">JPG, PNG o WEBP · máximo 8 MB</div>
const DOC_FILE_HINT = <div className="filehint">{DOC_HINT}</div>
const ACCEPT = 'image/jpeg,image/png,image/webp'

/** Los registros que crea el administrador quedan aprobados: él mismo revisó el documento */
async function submit(
  entry: Omit<FleetEntry, 'photo'>,
  file: File | null | undefined,
  docFile: File | null | undefined,
  add: (e: FleetEntry) => boolean,
) {
  const photo = await compressPhoto(file)
  const document = docFile ? await readDocument(docFile) : undefined
  if (!add({ ...entry, photo, document, review: newReview('Aprobado') }))
    throw Error(
      'No queda espacio en el navegador para guardar más fotografías. Prueba imágenes más pequeñas o elimina registros anteriores.',
    )
}

type DriverKey = 'driverName' | 'driverDetail' | 'driverPhoto' | 'driverDoc'
const DRIVER_FIELDS: DriverKey[] = ['driverName', 'driverDetail', 'driverPhoto', 'driverDoc']

export function DriverForm() {
  const { fleet, addFleetEntry } = useAppData()
  const toast = useToast()
  const rules: Rules<DriverKey> = {
    driverName: {
      required: true,
      minLen: 5,
      maxLen: 60,
      format: titleCase,
      check: v =>
        personName(v) || (fleet.drivers.some(d => sameText(d.name, v)) ? 'Ya existe un conductor registrado con ese nombre.' : ''),
    },
    driverDetail: { maxLen: 80, format: cleanSpaces, check: safeText },
    driverPhoto: { file: true, checkFile: photoCheck },
    driverDoc: { required: true, file: true, checkFile: docRule('driver') },
  }
  const form = useForm(rules, { driverName: '', driverDetail: '', driverPhoto: '', driverDoc: '' })

  async function add() {
    if (!form.validate(DRIVER_FIELDS)) return
    const f = form.applyFormats(DRIVER_FIELDS)
    try {
      await submit(
        { id: 'driver-' + Date.now().toString(36), name: f.driverName.trim(), detail: f.driverDetail.trim(), kind: 'driver' },
        form.files.driverPhoto,
        form.files.driverDoc,
        addFleetEntry,
      )
      form.reset(DRIVER_FIELDS)
      toast('Conductor agregado.', 'success')
    } catch (e) {
      toast((e as Error).message || 'No fue posible cargar la imagen.', 'error')
    }
  }

  return (
    <div>
      <h3>Agregar conductor</h3>
      <Field form={form} name="driverName" label="Nombre del conductor">
        <input {...form.bind('driverName')} placeholder="Nombre y apellido" autoCapitalize="words" />
      </Field>
      <Field form={form} name="driverDetail" label="Descripción (opcional)">
        <input {...form.bind('driverDetail')} placeholder="Ej.: conductor profesional" />
      </Field>
      <Field form={form} name="driverDoc" label="Licencia de conducir (foto o PDF)">
        <input type="file" {...form.bind('driverDoc')} accept={DOC_ACCEPT} />
        {DOC_FILE_HINT}
      </Field>
      <Field form={form} name="driverPhoto" label="Fotografía del conductor (opcional)">
        <input type="file" {...form.bind('driverPhoto')} accept={ACCEPT} />
        {FILE_HINT}
      </Field>
      <button type="button" className="primary full" onClick={add}>
        Agregar conductor
      </button>
    </div>
  )
}

type VehicleKey = 'vehicleName' | 'vehiclePlate' | 'vehicleDetail' | 'vehiclePhoto' | 'vehicleDoc'
const VEHICLE_FIELDS: VehicleKey[] = ['vehicleName', 'vehiclePlate', 'vehicleDetail', 'vehiclePhoto', 'vehicleDoc']

export function VehicleForm() {
  const { fleet, addFleetEntry } = useAppData()
  const toast = useToast()
  const rules: Rules<VehicleKey> = {
    vehicleName: {
      required: true,
      minLen: 2,
      maxLen: 50,
      format: cleanSpaces,
      check: v =>
        !RX.hasLetter.test(v)
          ? 'Ingresa la marca y el modelo (ej.: Hyundai Tucson).'
          : !RX.vehicleName.test(v)
            ? 'Solo se permiten letras, números, espacios, punto, guion y /.'
            : '',
    },
    vehiclePlate: {
      required: true,
      maxLen: 8,
      transform: v => v.toUpperCase().replace(/[^A-Z0-9]/g, ''),
      check: v =>
        !RX.plate.test(v)
          ? 'Patente no válida. Formatos: ABCD12 (actual) o AB1234 (antigua).'
          : fleet.vehicles.some(x => x.plate === v)
            ? 'Esta patente ya está registrada.'
            : '',
    },
    vehicleDetail: { maxLen: 80, format: cleanSpaces, check: safeText },
    vehiclePhoto: { file: true, checkFile: photoCheck },
    vehicleDoc: { required: true, file: true, checkFile: docRule('vehicle') },
  }
  const form = useForm(rules, { vehicleName: '', vehiclePlate: '', vehicleDetail: '', vehiclePhoto: '', vehicleDoc: '' })

  async function add() {
    if (!form.validate(VEHICLE_FIELDS)) return
    const f = form.applyFormats(VEHICLE_FIELDS)
    try {
      await submit(
        {
          id: 'vehicle-' + Date.now().toString(36),
          name: f.vehicleName.trim(),
          detail: f.vehicleDetail.trim(),
          kind: 'vehicle',
          plate: f.vehiclePlate.trim(),
        },
        form.files.vehiclePhoto,
        form.files.vehicleDoc,
        addFleetEntry,
      )
      form.reset(VEHICLE_FIELDS)
      toast('Vehículo agregado.', 'success')
    } catch (e) {
      toast((e as Error).message || 'No fue posible cargar la imagen.', 'error')
    }
  }

  return (
    <div>
      <h3>Agregar vehículo</h3>
      <Field form={form} name="vehicleName" label="Marca y modelo">
        <input {...form.bind('vehicleName')} placeholder="Ej.: Hyundai Tucson" />
      </Field>
      <Field form={form} name="vehiclePlate" label="Patente">
        <input {...form.bind('vehiclePlate')} placeholder="Ej.: ABCD12" autoCapitalize="characters" autoComplete="off" spellCheck={false} />
      </Field>
      <Field form={form} name="vehicleDetail" label="Descripción (opcional)">
        <input {...form.bind('vehicleDetail')} placeholder="Ej.: 4 pasajeros · color gris" />
      </Field>
      <Field form={form} name="vehicleDoc" label="Permiso de circulación (foto o PDF)">
        <input type="file" {...form.bind('vehicleDoc')} accept={DOC_ACCEPT} />
        {DOC_FILE_HINT}
      </Field>
      <Field form={form} name="vehiclePhoto" label="Fotografía del vehículo (opcional)">
        <input type="file" {...form.bind('vehiclePhoto')} accept={ACCEPT} />
        {FILE_HINT}
      </Field>
      <button type="button" className="primary full" onClick={add}>
        Agregar vehículo
      </button>
    </div>
  )
}
