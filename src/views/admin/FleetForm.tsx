import { Field } from '../../components/Field'
import { useAppData } from '../../context/AppDataContext'
import { useToast } from '../../context/ToastContext'
import { useForm, type Rules } from '../../hooks/useForm'
import { cleanSpaces, sameText, titleCase } from '../../lib/format'
import { compressPhoto } from '../../lib/photo'
import { personName, photoCheck, RX, safeText } from '../../lib/validators'
import type { FleetEntry } from '../../types'

const FILE_HINT = <div className="filehint">JPG, PNG o WEBP · máximo 8 MB</div>
const ACCEPT = 'image/jpeg,image/png,image/webp'

async function submit(
  entry: Omit<FleetEntry, 'photo'>,
  file: File | null | undefined,
  add: (e: FleetEntry) => boolean,
) {
  const photo = await compressPhoto(file)
  if (!add({ ...entry, photo }))
    throw Error(
      'No queda espacio en el navegador para guardar más fotografías. Prueba imágenes más pequeñas o elimina registros anteriores.',
    )
}

type DriverKey = 'driverName' | 'driverDetail' | 'driverPhoto'
const DRIVER_FIELDS: DriverKey[] = ['driverName', 'driverDetail', 'driverPhoto']

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
  }
  const form = useForm(rules, { driverName: '', driverDetail: '', driverPhoto: '' })

  async function add() {
    if (!form.validate(DRIVER_FIELDS)) return
    const f = form.applyFormats(DRIVER_FIELDS)
    try {
      await submit(
        { id: 'driver-' + Date.now().toString(36), name: f.driverName.trim(), detail: f.driverDetail.trim(), kind: 'driver' },
        form.files.driverPhoto,
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

type VehicleKey = 'vehicleName' | 'vehiclePlate' | 'vehicleDetail' | 'vehiclePhoto'
const VEHICLE_FIELDS: VehicleKey[] = ['vehicleName', 'vehiclePlate', 'vehicleDetail', 'vehiclePhoto']

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
  }
  const form = useForm(rules, { vehicleName: '', vehiclePlate: '', vehicleDetail: '', vehiclePhoto: '' })

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
