import { useEffect } from 'react'
import { Field } from '../../components/Field'
import { FleetPhoto, Plate } from '../../components/FleetPhoto'
import { useAppData } from '../../context/AppDataContext'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useForm, type Rules } from '../../hooks/useForm'
import { useMyFleet } from '../../hooks/useMyFleet'
import { cleanSpaces, formatPhone, phoneInput, sameText, titleCase } from '../../lib/format'
import { compressPhoto } from '../../lib/photo'
import { intRule, personName, phoneCheck, photoCheck, RX, safeText } from '../../lib/validators'
import type { FleetEntry } from '../../types'

const ACCEPT = 'image/jpeg,image/png,image/webp'
const FILE_HINT = <div className="filehint">JPG, PNG o WEBP · máximo 8 MB. Si no eliges una, se mantiene la actual.</div>
const LICENSES = ['B', 'A1', 'A2', 'A3', 'A4', 'A5']
const MAX_YEAR = new Date().getFullYear() + 1

const NO_SPACE = 'No queda espacio en el navegador. Prueba con una imagen más pequeña.'

type DriverKey = 'dName' | 'dPhone' | 'dLicense' | 'dDetail' | 'dPhoto'
const DRIVER_FIELDS: DriverKey[] = ['dName', 'dPhone', 'dLicense', 'dDetail', 'dPhoto']

function MyDriverForm({ active }: { active: boolean }) {
  const { fleet, saveFleetEntry } = useAppData()
  const { user, updateProfile } = useAuth()
  const { driver } = useMyFleet()
  const toast = useToast()

  const rules: Rules<DriverKey> = {
    dName: {
      required: true,
      minLen: 5,
      maxLen: 60,
      format: titleCase,
      check: v =>
        personName(v) ||
        (fleet.drivers.some(d => d.id !== driver?.id && sameText(d.name, v))
          ? 'Ya existe un conductor registrado con ese nombre.'
          : ''),
    },
    dPhone: { required: true, maxLen: 20, transform: phoneInput, format: formatPhone, check: phoneCheck },
    dLicense: { required: true },
    dDetail: { maxLen: 80, format: cleanSpaces, check: safeText },
    dPhoto: { file: true, checkFile: photoCheck },
  }
  const initial = () => ({
    dName: driver?.name ?? user?.name ?? '',
    dPhone: driver?.phone ?? user?.phone ?? '',
    dLicense: driver?.license ?? '',
    dDetail: driver?.detail ?? '',
    dPhoto: '',
  })
  const form = useForm(rules, initial())

  useEffect(() => {
    if (!active) return
    form.reset(['dPhoto'])
    form.setValues(initial())
    form.untouch(DRIVER_FIELDS)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  async function save() {
    if (!user || !form.validate(DRIVER_FIELDS)) return
    const f = form.applyFormats(DRIVER_FIELDS)
    try {
      const file = form.files.dPhoto
      const entry: FleetEntry = {
        id: driver?.id ?? 'driver-' + Date.now().toString(36),
        kind: 'driver',
        userId: user.id,
        name: f.dName.trim(),
        phone: formatPhone(f.dPhone),
        license: f.dLicense,
        detail: f.dDetail.trim(),
        photo: file ? await compressPhoto(file) : (driver?.photo ?? ''),
      }
      if (!saveFleetEntry(entry)) throw Error(NO_SPACE)
      updateProfile({ name: entry.name, phone: entry.phone ?? user.phone })
      form.reset(['dPhoto'])
      toast('Tus datos fueron guardados.', 'success')
    } catch (e) {
      toast((e as Error).message || 'No fue posible cargar la imagen.', 'error')
    }
  }

  return (
    <div className="card">
      <h2>Mis datos de conductor</h2>
      {driver && (
        <div className="profile">
          <FleetPhoto entry={driver} />
          <div>
            <b>{driver.name}</b>
            <span className="hint">
              Licencia clase {driver.license} · {driver.phone}
              {driver.detail ? ' · ' + driver.detail : ''}
            </span>
          </div>
        </div>
      )}
      {!driver && <div className="notice">Completa tus datos para que podamos asignarte servicios.</div>}
      <div className="grid" style={{ marginTop: 14 }}>
        <Field form={form} name="dName" label="Nombre y apellido">
          <input {...form.bind('dName')} autoComplete="name" autoCapitalize="words" />
        </Field>
        <Field form={form} name="dPhone" label="Teléfono">
          <input type="tel" {...form.bind('dPhone')} placeholder="+56 9 1234 5678" inputMode="tel" autoComplete="tel" />
        </Field>
        <Field form={form} name="dLicense" label="Clase de licencia">
          <select {...form.bind('dLicense')}>
            <option value="">Selecciona…</option>
            {LICENSES.map(l => (
              <option key={l} value={l}>
                Clase {l}
              </option>
            ))}
          </select>
        </Field>
        <Field form={form} name="dDetail" label="Descripción (opcional)">
          <input {...form.bind('dDetail')} placeholder="Ej.: 10 años de experiencia, bilingüe" />
        </Field>
      </div>
      <Field form={form} name="dPhoto" label="Fotografía (opcional)">
        <input type="file" {...form.bind('dPhoto')} accept={ACCEPT} />
        {FILE_HINT}
      </Field>
      <button type="button" className="primary full" onClick={save}>
        Guardar mis datos
      </button>
    </div>
  )
}

type VehicleKey = 'vName' | 'vPlate' | 'vYear' | 'vDetail' | 'vPhoto'
const VEHICLE_FIELDS: VehicleKey[] = ['vName', 'vPlate', 'vYear', 'vDetail', 'vPhoto']

function MyVehicleForm({ active }: { active: boolean }) {
  const { fleet, saveFleetEntry } = useAppData()
  const { user } = useAuth()
  const { vehicle } = useMyFleet()
  const toast = useToast()

  const rules: Rules<VehicleKey> = {
    vName: {
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
    vPlate: {
      required: true,
      maxLen: 8,
      transform: v => v.toUpperCase().replace(/[^A-Z0-9]/g, ''),
      check: v =>
        !RX.plate.test(v)
          ? 'Patente no válida. Formatos: ABCD12 (actual) o AB1234 (antigua).'
          : fleet.vehicles.some(x => x.id !== vehicle?.id && x.plate === v)
            ? 'Esta patente ya está registrada.'
            : '',
    },
    vYear: { required: true, check: intRule(1990, MAX_YEAR) },
    vDetail: { maxLen: 80, format: cleanSpaces, check: safeText },
    vPhoto: { file: true, checkFile: photoCheck },
  }
  const initial = () => ({
    vName: vehicle?.name ?? '',
    vPlate: vehicle?.plate ?? '',
    vYear: vehicle?.year ?? '',
    vDetail: vehicle?.detail ?? '',
    vPhoto: '',
  })
  const form = useForm(rules, initial())

  useEffect(() => {
    if (!active) return
    form.reset(['vPhoto'])
    form.setValues(initial())
    form.untouch(VEHICLE_FIELDS)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  async function save() {
    if (!user || !form.validate(VEHICLE_FIELDS)) return
    const f = form.applyFormats(VEHICLE_FIELDS)
    try {
      const file = form.files.vPhoto
      const entry: FleetEntry = {
        id: vehicle?.id ?? 'vehicle-' + Date.now().toString(36),
        kind: 'vehicle',
        userId: user.id,
        name: f.vName.trim(),
        plate: f.vPlate.trim(),
        year: f.vYear,
        detail: f.vDetail.trim(),
        photo: file ? await compressPhoto(file) : (vehicle?.photo ?? ''),
      }
      if (!saveFleetEntry(entry)) throw Error(NO_SPACE)
      form.reset(['vPhoto'])
      toast('Datos del vehículo guardados.', 'success')
    } catch (e) {
      toast((e as Error).message || 'No fue posible cargar la imagen.', 'error')
    }
  }

  return (
    <div className="card">
      <h2>Mi vehículo</h2>
      {vehicle ? (
        <div className="profile">
          <FleetPhoto entry={vehicle} />
          <div>
            <b>
              {vehicle.name} {vehicle.year}
            </b>
            <span className="hint">
              <Plate entry={vehicle} />
              {vehicle.detail}
            </span>
          </div>
        </div>
      ) : (
        <div className="notice">Aún no registras un vehículo. Es necesario para servicios de traslado.</div>
      )}
      <div className="grid" style={{ marginTop: 14 }}>
        <Field form={form} name="vName" label="Marca y modelo">
          <input {...form.bind('vName')} placeholder="Ej.: Hyundai Tucson" />
        </Field>
        <Field form={form} name="vPlate" label="Patente">
          <input {...form.bind('vPlate')} placeholder="Ej.: ABCD12" autoCapitalize="characters" autoComplete="off" spellCheck={false} />
        </Field>
        <Field form={form} name="vYear" label="Año">
          <input type="number" {...form.bind('vYear')} inputMode="numeric" min={1990} max={MAX_YEAR} step={1} />
        </Field>
        <Field form={form} name="vDetail" label="Descripción (opcional)">
          <input {...form.bind('vDetail')} placeholder="Ej.: 4 pasajeros · color gris" />
        </Field>
      </div>
      <Field form={form} name="vPhoto" label="Fotografía del vehículo (opcional)">
        <input type="file" {...form.bind('vPhoto')} accept={ACCEPT} />
        {FILE_HINT}
      </Field>
      <button type="button" className="primary full" onClick={save}>
        Guardar vehículo
      </button>
    </div>
  )
}

export function DriverProfileView({ hidden }: { hidden: boolean }) {
  return (
    <section id="driver" className={hidden ? 'hidden' : undefined}>
      <MyDriverForm active={!hidden} />
      <MyVehicleForm active={!hidden} />
    </section>
  )
}
