import { useEffect } from 'react'
import { Field } from '../../components/Field'
import { useAppData } from '../../context/AppDataContext'
import { useToast } from '../../context/ToastContext'
import { useForm, type Rules } from '../../hooks/useForm'
import { moneyRule } from '../../lib/validators'
import type { RatesConfig } from '../../types'

type RateKey = keyof RatesConfig

const FIELDS: { key: RateKey; id: string; label: string }[] = [
  { key: 'vehicleBase', id: 'cfgVehicleBase', label: 'Base vehículo ($)' },
  { key: 'vehicleKm', id: 'cfgVehicleKm', label: 'Por km vehículo ($)' },
  { key: 'driverBase', id: 'cfgDriverBase', label: 'Base conductor ($)' },
  { key: 'driverKm', id: 'cfgDriverKm', label: 'Por km conductor ($)' },
  { key: 'wait', id: 'cfgWait', label: 'Por hora de espera ($)' },
]
const KEYS = FIELDS.map(f => f.key)

const rules: Rules<RateKey> = Object.fromEntries(KEYS.map(k => [k, { required: true, check: moneyRule }]))

const toStrings = (c: RatesConfig) =>
  Object.fromEntries(KEYS.map(k => [k, String(c[k])])) as Record<RateKey, string>

/** `active`: al entrar al panel se recargan las tarifas guardadas */
export function RatesForm({ active }: { active: boolean }) {
  const { config, saveConfig } = useAppData()
  const toast = useToast()
  const form = useForm(rules, toStrings(config))

  useEffect(() => {
    if (!active) return
    form.setValues(toStrings(config))
    form.untouch(KEYS)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  function save() {
    if (!form.validate(KEYS)) return
    const next = Object.fromEntries(KEYS.map(k => [k, Number(form.values[k])])) as unknown as RatesConfig
    if (saveConfig(next)) toast('Tarifas guardadas en este navegador.', 'success')
    else toast('No fue posible guardar las tarifas.', 'error')
  }

  return (
    <div className="card">
      <h2>Tarifas configurables</h2>
      <div className="grid">
        {FIELDS.map(({ key, label }) => (
          <Field key={key} form={form} name={key} label={label}>
            <input type="number" {...form.bind(key)} inputMode="numeric" min={0} max={1000000} step={1} />
          </Field>
        ))}
      </div>
      <button type="button" className="primary full" onClick={save}>
        Guardar tarifas
      </button>
    </div>
  )
}
