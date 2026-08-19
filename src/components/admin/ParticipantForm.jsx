import { useEffect, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import {
  ARRANCONES_CLASSES,
  CATEGORIES,
  STATUSES,
  validateParticipant,
} from '../../../shared/participants';
import { ESTADOS, ESTADO_OTRO, municipiosDe } from '../../../shared/mexico';
import { BUTTON, INPUT, Modal } from './ui';

const blank = {
  category: 'car_show',
  race_class: '',
  pilot_name: '',
  copilot_name: '',
  vehicle_name: '',
  phone: '',
  state: '',
  city: '',
  social: '',
  status: 'pendiente',
  notes: '',
};

const fromParticipant = (participant) =>
  participant
    ? {
        category: participant.category,
        race_class: participant.race_class ?? '',
        pilot_name: participant.pilot_name,
        copilot_name: participant.copilot_name ?? '',
        vehicle_name: participant.vehicle_name,
        phone: participant.phone,
        state: participant.state ?? '',
        city: participant.city,
        social: participant.social ?? '',
        status: participant.status,
        notes: participant.notes ?? '',
      }
    : blank;

function Field({ label, error, optional, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.15em] text-white/60">
          {label}
        </span>
        {optional && <span className="text-[11px] text-white/30">Opcional</span>}
      </span>
      <div className="mt-1.5">{children}</div>
      {error && (
        <span className="mt-1 flex items-center gap-1 text-xs text-racing-red">
          <AlertCircle size={12} /> {error}
        </span>
      )}
    </label>
  );
}

export default function ParticipantForm({ open, participant, onClose, onSubmit }) {
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(fromParticipant(participant));
      setErrors({});
      setServerError('');
    }
  }, [open, participant]);

  const category = CATEGORIES[form.category];
  const municipios = municipiosDe(form.state);
  const freeCity = form.state === ESTADO_OTRO;

  const set = (key) => (event) => {
    const { value } = event.target;
    setForm((prev) => {
      if (key === 'category') {
        const next = CATEGORIES[value];
        return {
          ...prev,
          category: value,
          copilot_name: next.allowsCopilot ? prev.copilot_name : '',
          race_class: next.requiresRaceClass ? prev.race_class : '',
        };
      }
      // Cambiar de estado invalida el municipio elegido antes.
      if (key === 'state') return { ...prev, state: value, city: '' };
      return { ...prev, [key]: value };
    });
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setServerError('');
    const { ok, errors: found } = validateParticipant(form);
    if (!ok) return setErrors(found);

    setSaving(true);
    try {
      await onSubmit(form);
      onClose();
    } catch (error) {
      setErrors(error.fields ?? {});
      setServerError(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title={participant ? 'Editar participante' : 'Nuevo participante'}
      subtitle={
        participant
          ? 'Los cambios se guardan directo en la base del evento.'
          : 'Alta manual, para quien se inscribió por teléfono o en persona.'
      }
    >
      <form onSubmit={submit} className="space-y-5">
        <Field label="Categoría" error={errors.category}>
          <div className="grid gap-2 sm:grid-cols-3">
            {Object.values(CATEGORIES).map((item) => {
              const active = form.category === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => set('category')({ target: { value: item.id } })}
                  className={`border px-3 py-2.5 text-left transition ${
                    active
                      ? 'border-racing-red bg-racing-red/10'
                      : 'border-white/12 bg-[#0F0F0F] hover:border-white/30'
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-white">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: item.chart }}
                      aria-hidden="true"
                    />
                    {item.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-white/40">{item.feeLabel}</span>
                </button>
              );
            })}
          </div>
        </Field>

        {category.requiresRaceClass && (
          <Field label="Clase de arrancón" error={errors.race_class}>
            <select className={INPUT} value={form.race_class} onChange={set('race_class')}>
              <option value="">Elige la clase</option>
              {Object.values(ARRANCONES_CLASSES).map((klass) => (
                <option key={klass.id} value={klass.id}>
                  {klass.label}
                </option>
              ))}
            </select>
          </Field>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Piloto" error={errors.pilot_name}>
            <input className={INPUT} value={form.pilot_name} onChange={set('pilot_name')} />
          </Field>
          <Field label="Vehículo" error={errors.vehicle_name}>
            <input className={INPUT} value={form.vehicle_name} onChange={set('vehicle_name')} />
          </Field>

          <Field
            label="Copiloto"
            optional
            error={errors.copilot_name}
            className={category.allowsCopilot ? '' : 'opacity-50'}
          >
            <input
              className={INPUT}
              value={form.copilot_name}
              onChange={set('copilot_name')}
              disabled={!category.allowsCopilot}
              placeholder={category.allowsCopilot ? 'Sin copiloto' : 'En arrancones no sube al auto durante las corridas'}
            />
          </Field>
          <Field label="Estatus" error={errors.status}>
            <select className={INPUT} value={form.status} onChange={set('status')}>
              {Object.values(STATUSES).map((status) => (
                <option key={status.id} value={status.id}>
                  {status.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="WhatsApp" error={errors.phone}>
            <input
              className={INPUT}
              value={form.phone}
              onChange={set('phone')}
              inputMode="numeric"
              placeholder="6381234567"
            />
          </Field>
          <Field label="Estado" error={errors.state}>
            <select className={INPUT} value={form.state} onChange={set('state')}>
              <option value="">Elige un estado</option>
              {ESTADOS.map((estado) => (
                <option key={estado} value={estado}>
                  {estado}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Municipio" error={errors.city} className="sm:col-span-2">
            {freeCity || !form.state ? (
              <input
                className={`${INPUT} disabled:opacity-45`}
                value={form.city}
                onChange={set('city')}
                disabled={!form.state}
                placeholder={form.state ? 'Ciudad y país' : 'Primero elige un estado'}
              />
            ) : (
              <select className={INPUT} value={form.city} onChange={set('city')}>
                <option value="">Elige un municipio</option>
                {municipios.map((municipio) => (
                  <option key={municipio} value={municipio}>
                    {municipio}
                  </option>
                ))}
              </select>
            )}
          </Field>

          <Field label="Red social" optional error={errors.social} className="sm:col-span-2">
            <input
              className={INPUT}
              value={form.social}
              onChange={set('social')}
              placeholder="https://instagram.com/usuario o @usuario"
            />
          </Field>

          <Field label="Notas internas" optional error={errors.notes} className="sm:col-span-2">
            <textarea
              className={`${INPUT} min-h-[80px] resize-y`}
              value={form.notes}
              onChange={set('notes')}
              placeholder="Acuerdos, pendientes, número asignado…"
            />
          </Field>
        </div>

        {serverError && (
          <p className="flex items-center gap-2 border border-racing-red/40 bg-racing-red/10 px-3 py-2.5 text-sm text-white">
            <AlertCircle size={16} className="shrink-0 text-racing-red" /> {serverError}
          </p>
        )}

        <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
          <button type="button" className={BUTTON.ghost} onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className={BUTTON.primary} disabled={saving}>
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Guardando…
              </>
            ) : participant ? (
              'Guardar cambios'
            ) : (
              'Agregar participante'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
