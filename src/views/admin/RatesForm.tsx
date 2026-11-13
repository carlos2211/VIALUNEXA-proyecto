import { useEffect } from 'react'
import { Field } from '../../components/Field'
import { useAppData } from '../../context/AppDataContext'
import { useToast } from '../../context/ToastContext'
import { useForm, type Rules } from '../../hooks/useForm'
import { MODE_OPTIONS } from '../../lib/constants'
import { money } from '../../lib/format'
import { quote } from '../../lib/quote'
import { moneyRule } from '../../lib/validators'
import type { Mode, RatesConfig } from '../../types'

type RateKey = keyof RatesConfig

interface RateField {
  key: RateKey
  label: string
  help: string
}

/** Tarifas agrupadas por modalidad de viaje */
const GROUPS: { mode: Mode | null; title: string; desc: string; fields: RateField[] }[] = [
  {
    mode: 'vehiculo',
    title: MODE_OPTIONS.find(o => o.value === 'vehiculo')!.title,
    desc: 'Usamos nuestro vehículo y nuestro conductor.',
    fields: [
      { key: 'vehicleBase', label: 'Tarifa base ($)', help: 'Se cobra una vez por viaje.' },
      { key: 'vehicleKm', label: 'Valor por km ($)', help: 'Por cada km recorrido (ida y regreso cuenta doble).' },
    ],
  },
  {
    mode: 'conductor',
    title: MODE_OPTIONS.find(o => o.value === 'conductor')!.title,
    desc: 'Enviamos solo un conductor; el viaje es en el auto del cliente.',
    fields: [
      { key: 'driverBase', label: 'Tarifa base conductor ($)', help: 'Se cobra una vez por viaje.' },
      { key: 'driverKm', label: 'Valor por km conductor ($)', help: 'Por cada km recorrido (ida y regreso cuenta doble).' },
    ],
  },
  {
    mode: null,
    title: 'Tiempo de espera',
    desc: 'Aplica a ambas modalidades cuando el cliente pide que lo esperen.',
    fields: [{ key: 'wait', label: 'Valor por hora de espera ($)', help: 'Se cobra proporcional a los minutos.' }],
  },
]
const KEYS = GROUPS.flatMap(g => g.fields.map(f => f.key))

/** Viaje de ejemplo para la vista previa */
const SAMPLE_KM = 20

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

  // Vista previa con lo que el admin está escribiendo (antes de guardar)
  const draft = Object.fromEntries(KEYS.map(k => [k, Math.max(0, Number(form.values[k]) || 0)])) as unknown as RatesConfig
  const sample = (mode: Mode) =>
    quote({ mode, trip: 'ida', distance: String(SAMPLE_KM), wait: '0', customWait: '0' }, draft).total

  function save() {
    if (!form.validate(KEYS)) return
    const next = Object.fromEntries(KEYS.map(k => [k, Number(form.values[k])])) as unknown as RatesConfig
    if (saveConfig(next)) toast('Tarifas guardadas en este navegador.', 'success')
    else toast('No fue posible guardar las tarifas.', 'error')
  }

  return (
    <div className="card">
      <h2>Tarifas configurables</h2>
      <p className="hint">
        Precio del viaje = tarifa base + (km × valor por km) + espera. Los km se calculan automáticamente según la ruta
        entre la recogida y el destino.
      </p>

      {GROUPS.map(g => (
        <fieldset key={g.title} className="rategroup">
          <legend>{g.title}</legend>
          <p className="hint">{g.desc}</p>
          <div className="grid">
            {g.fields.map(({ key, label, help }) => (
              <Field key={key} form={form} name={key} label={label}>
                <input type="number" {...form.bind(key)} inputMode="numeric" min={0} max={1000000} step={1} />
                <small className="hint">{help}</small>
              </Field>
            ))}
          </div>
          {g.mode && (
            <div className="rateexample">
              Ejemplo, viaje de {SAMPLE_KM} km solo ida sin espera: <b>{money(sample(g.mode))}</b>
            </div>
          )}
        </fieldset>
      ))}

      <button type="button" className="primary full" onClick={save}>
        Guardar tarifas
      </button>
    </div>
  )
}
