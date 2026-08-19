import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Loader2, AlertCircle, Info } from 'lucide-react';
import { EVENT } from '../data/event';
import {
  ARRANCONES_CLASSES,
  CATEGORIES,
  raceClassLabel,
  validateParticipant,
} from '../../shared/participants';
import { ESTADOS, ESTADO_OTRO, municipiosDe } from '../../shared/mexico';
import { createParticipant } from '../lib/api';
import { Link } from '../router';

const EMPTY = {
  category: '',
  race_class: '',
  pilot_name: '',
  copilot_name: '',
  vehicle_name: '',
  phone: '',
  state: '',
  city: '',
  social: '',
};

function Field({ label, hint, error, optional, children }) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
          {label}
        </span>
        {optional && <span className="text-[11px] text-white/35">Opcional</span>}
      </span>
      <div className="mt-2">{children}</div>
      {error ? (
        <span className="mt-1.5 flex items-center gap-1.5 text-xs text-racing-red">
          <AlertCircle size={13} /> {error}
        </span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs text-white/40">{hint}</span>
      ) : null}
    </label>
  );
}

const inputClass = (error) =>
  `w-full border bg-racing-asphalt px-4 py-3 text-white placeholder-white/25 outline-none transition focus:border-racing-red focus:ring-1 focus:ring-racing-red/40 ${
    error ? 'border-racing-red/70' : 'border-white/15'
  }`;

export default function Register() {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(null);

  const category = CATEGORIES[form.category];

  const set = (key) => (event) => {
    const { value } = event.target;
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  // Al cambiar de estado el municipio anterior deja de tener sentido.
  const pickState = (event) => {
    const { value } = event.target;
    setForm((prev) => ({ ...prev, state: value, city: '' }));
    setErrors((prev) => ({ ...prev, state: undefined, city: undefined }));
  };

  const municipios = municipiosDe(form.state);
  const freeCity = form.state === ESTADO_OTRO;

  const pickCategory = (id) => {
    setForm((prev) => ({
      ...prev,
      category: id,
      copilot_name: CATEGORIES[id].allowsCopilot ? prev.copilot_name : '',
      race_class: CATEGORIES[id].requiresRaceClass ? prev.race_class : '',
    }));
    setErrors((prev) => ({
      ...prev,
      category: undefined,
      copilot_name: undefined,
      race_class: undefined,
    }));
  };

  const pickRaceClass = (id) => {
    setForm((prev) => ({ ...prev, race_class: id }));
    setErrors((prev) => (prev.race_class ? { ...prev, race_class: undefined } : prev));
  };

  const submit = async (event) => {
    event.preventDefault();
    setServerError('');
    const { ok, errors: found } = validateParticipant(form);
    if (!ok) {
      setErrors(found);
      document.querySelector('[data-invalid="true"]')?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
      return;
    }
    setSending(true);
    try {
      const participant = await createParticipant(form);
      setDone(participant);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setErrors(error.fields ?? {});
      setServerError(error.message);
    } finally {
      setSending(false);
    }
  };

  const summary = useMemo(() => {
    if (!category) return null;
    const withCopilot = category.allowsCopilot && form.copilot_name.trim().length > 0;
    const raceClass = category.requiresRaceClass ? raceClassLabel(form.race_class) : '';
    return { category, withCopilot, raceClass };
  }, [category, form.copilot_name, form.race_class]);

  if (done) {
    const registerAnother = () => {
      setDone(null);
      setForm(EMPTY);
      setErrors({});
      window.scrollTo({ top: 0 });
    };

    return (
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-white/10 bg-racing-smoke p-8 text-center md:p-12"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
            <Check size={34} className="text-emerald-400" />
          </div>
          <h1 className="display mt-6 text-4xl uppercase md:text-5xl">¡Registro recibido!</h1>
          <p className="mt-3 text-white/60">
            Ya estás en la lista de {CATEGORIES[done.category].label}. Te esperamos el{' '}
            {CATEGORIES[done.category].day.toLowerCase()} en {EVENT.venue}.
          </p>

          <dl className="mt-8 space-y-3 text-left text-sm">
            {[
              ['Piloto', done.pilot_name],
              ['Copiloto', done.copilot_name || 'Sin copiloto'],
              ['Vehículo', done.vehicle_name],
              ['Categoría', CATEGORIES[done.category].label],
              ...(done.race_class ? [['Clase', raceClassLabel(done.race_class)]] : []),
              ['Cuota', CATEGORIES[done.category].feeLabel],
              ['Día', CATEGORIES[done.category].day],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between border-b border-white/5 pb-2">
                <dt className="text-white/45">{label}</dt>
                <dd className="font-medium text-white">{value}</dd>
              </div>
            ))}
          </dl>

          <button type="button" onClick={registerAnother} className="btn-racing mt-8 w-full">
            Registrar otro vehículo
          </button>
          <Link
            to="/"
            className="mt-4 block text-sm text-white/50 underline-offset-4 hover:text-white hover:underline"
          >
            Volver al sitio del evento
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:py-16">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-white/50 transition hover:text-white"
      >
        <ArrowLeft size={16} /> {EVENT.name}
      </Link>

      <header className="mt-6">
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-racing-red">
          Inscripción de participantes
        </span>
        <h1 className="section-heading mt-3">
          Registra tu <span className="text-racing-red">máquina</span>
        </h1>
        <p className="mt-4 max-w-xl text-white/60">
          {EVENT.displayDate} · {EVENT.venue}, {EVENT.city}. Llena el formulario y tu lugar queda
          apartado. Guardamos tu WhatsApp solo por si hay cambios en el programa.
        </p>
      </header>

      <form onSubmit={submit} className="mt-10 space-y-10">
        <section>
          <h2 className="display text-2xl uppercase text-white">1 · Categoría</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {Object.values(CATEGORIES).map((cat) => {
              const active = form.category === cat.id;
              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => pickCategory(cat.id)}
                  data-invalid={errors.category ? 'true' : undefined}
                  className={`group relative overflow-hidden border p-5 text-left transition ${
                    active
                      ? 'border-racing-red bg-racing-red/10'
                      : 'border-white/10 bg-racing-smoke hover:border-white/30'
                  }`}
                >
                  <span
                    className="absolute inset-x-0 top-0 h-1"
                    style={{ background: cat.color, opacity: active ? 1 : 0.35 }}
                  />
                  <span className="display block text-2xl uppercase text-white">{cat.label}</span>
                  <span className="mt-1 block text-xs text-white/40">{cat.tagline}</span>
                  <span
                    className="mt-4 block text-lg font-bold"
                    style={{ color: cat.fee ? '#FFFFFF' : '#22C55E' }}
                  >
                    {cat.feeLabel}
                  </span>
                  <span className="mt-1 block text-[11px] uppercase tracking-wider text-white/35">
                    {cat.day.replace(' de septiembre', '')}
                  </span>
                </button>
              );
            })}
          </div>
          {errors.category && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-racing-red">
              <AlertCircle size={13} /> {errors.category}
            </p>
          )}
          {category && (
            <p className="mt-4 flex items-start gap-2 border-l-2 border-racing-gold/60 bg-white/[0.03] p-3 text-sm text-white/70">
              <Info size={16} className="mt-0.5 shrink-0 text-racing-gold" />
              {category.note}
            </p>
          )}

          {category?.requiresRaceClass && (
            <div className="mt-5">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                Categoría del arrancón
              </span>
              <p className="mt-1 text-xs text-white/40">
                Elige en qué corrida vas a competir.
              </p>
              <div
                data-invalid={errors.race_class ? 'true' : undefined}
                className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
              >
                {Object.values(ARRANCONES_CLASSES).map((klass) => {
                  const active = form.race_class === klass.id;
                  return (
                    <button
                      type="button"
                      key={klass.id}
                      onClick={() => pickRaceClass(klass.id)}
                      className={`border px-4 py-3 text-left text-sm font-medium transition ${
                        active
                          ? 'border-racing-red bg-racing-red/10 text-white'
                          : 'border-white/12 bg-racing-smoke text-white/70 hover:border-white/30 hover:text-white'
                      }`}
                    >
                      {klass.label}
                    </button>
                  );
                })}
              </div>
              {errors.race_class && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-racing-red">
                  <AlertCircle size={13} /> {errors.race_class}
                </p>
              )}
            </div>
          )}
        </section>

        <section>
          <h2 className="display text-2xl uppercase text-white">2 · Piloto y vehículo</h2>
          <div className="mt-4 grid gap-5 md:grid-cols-2">
            <Field label="Nombre del piloto" error={errors.pilot_name}>
              <input
                type="text"
                value={form.pilot_name}
                onChange={set('pilot_name')}
                placeholder="Nombre y apellido"
                data-invalid={errors.pilot_name ? 'true' : undefined}
                className={inputClass(errors.pilot_name)}
              />
            </Field>

            <Field
              label="Nombre del vehículo"
              hint="Como lo conocen en la pista"
              error={errors.vehicle_name}
            >
              <input
                type="text"
                value={form.vehicle_name}
                onChange={set('vehicle_name')}
                placeholder="Ej. La Paloma"
                data-invalid={errors.vehicle_name ? 'true' : undefined}
                className={inputClass(errors.vehicle_name)}
              />
            </Field>

            <div className="md:col-span-2">
              {category && !category.allowsCopilot ? (
                <div className="flex items-start gap-2 border border-white/10 bg-white/[0.02] p-4 text-sm text-white/50">
                  <Info size={16} className="mt-0.5 shrink-0 text-racing-red" />
                  En arrancones no se registra copiloto: durante las corridas solo el piloto sube al auto. Tu acompañante sí puede ir contigo al evento.
                </div>
              ) : (
                <Field
                  label="Nombre del copiloto"
                  optional
                  hint={
                    form.category === 'car_show'
                      ? 'El copiloto entra gratis con tu inscripción.'
                      : 'Déjalo vacío si compites solo.'
                  }
                  error={errors.copilot_name}
                >
                  <input
                    type="text"
                    value={form.copilot_name}
                    onChange={set('copilot_name')}
                    placeholder="Nombre y apellido"
                    data-invalid={errors.copilot_name ? 'true' : undefined}
                    className={inputClass(errors.copilot_name)}
                  />
                </Field>
              )}
            </div>
          </div>
        </section>

        <section>
          <h2 className="display text-2xl uppercase text-white">3 · Contacto</h2>
          <div className="mt-4 grid gap-5 md:grid-cols-2">
            <Field label="WhatsApp" hint="10 dígitos" error={errors.phone}>
              <input
                type="tel"
                inputMode="numeric"
                value={form.phone}
                onChange={set('phone')}
                placeholder="638 123 4567"
                data-invalid={errors.phone ? 'true' : undefined}
                className={inputClass(errors.phone)}
              />
            </Field>

            <Field label="Estado" error={errors.state}>
              <select
                value={form.state}
                onChange={pickState}
                data-invalid={errors.state ? 'true' : undefined}
                className={inputClass(errors.state)}
              >
                <option value="">Elige tu estado</option>
                {ESTADOS.map((estado) => (
                  <option key={estado} value={estado}>
                    {estado}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="Municipio"
              hint={freeCity ? 'Escribe tu ciudad y país' : undefined}
              error={errors.city}
            >
              {freeCity || !form.state ? (
                <input
                  type="text"
                  value={form.city}
                  onChange={set('city')}
                  disabled={!form.state}
                  placeholder={form.state ? 'Phoenix, Arizona' : 'Primero elige tu estado'}
                  data-invalid={errors.city ? 'true' : undefined}
                  className={`${inputClass(errors.city)} disabled:opacity-45`}
                />
              ) : (
                <select
                  value={form.city}
                  onChange={set('city')}
                  data-invalid={errors.city ? 'true' : undefined}
                  className={inputClass(errors.city)}
                >
                  <option value="">Elige tu municipio</option>
                  {municipios.map((municipio) => (
                    <option key={municipio} value={municipio}>
                      {municipio}
                    </option>
                  ))}
                </select>
              )}
            </Field>

            <div className="md:col-span-2">
              <Field
                label="Red social"
                optional
                hint="Pega el link de tu perfil o escribe tu usuario. Sirve para etiquetarte en las publicaciones del evento."
                error={errors.social}
              >
                <input
                  type="text"
                  value={form.social}
                  onChange={set('social')}
                  placeholder="https://instagram.com/tu_usuario"
                  className={inputClass(errors.social)}
                />
              </Field>
            </div>
          </div>
        </section>

        {summary && (
          <div className="flex flex-wrap items-center justify-between gap-4 border border-white/10 bg-racing-smoke p-5">
            <div>
              <span className="text-xs uppercase tracking-[0.25em] text-white/40">
                Resumen de tu inscripción
              </span>
              <p className="mt-1 text-white">
                {summary.category.label}
                {summary.raceClass ? ` · ${summary.raceClass}` : ''} ·{' '}
                {summary.withCopilot ? 'Piloto y copiloto' : 'Solo piloto'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs uppercase tracking-[0.25em] text-white/40">A pagar</span>
              <p className="display text-3xl text-racing-red">{summary.category.feeLabel}</p>
            </div>
          </div>
        )}

        {serverError && (
          <p className="flex items-center gap-2 border border-racing-red/40 bg-racing-red/10 p-4 text-sm text-white">
            <AlertCircle size={18} className="shrink-0 text-racing-red" /> {serverError}
          </p>
        )}

        <button type="submit" disabled={sending} className="btn-racing w-full disabled:opacity-60">
          {sending ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Enviando…
            </>
          ) : (
            'Enviar registro'
          )}
        </button>
        <p className="pb-8 text-center text-xs text-white/35">
          Al enviar aceptas que el equipo de {EVENT.organizer} te contacte por WhatsApp.
        </p>
      </form>
    </div>
  );
}
