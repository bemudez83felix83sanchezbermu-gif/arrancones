import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, CloudOff, Minus, Plus, Ticket, Trash2 } from 'lucide-react';
import { BUTTON, EmptyState, INPUT, Panel } from '../admin/ui';
import {
  MAX_PEOPLE_PER_SALE,
  PAID_METHOD_IDS,
  PAYMENT_METHODS,
  formatPesos,
  parseMoney,
} from '../../../shared/taquilla';

const QUICK_CASH = [100, 200, 500, 1000, 2000];
const round2 = (n) => Math.round(n * 100) / 100;

export default function SellView({ types, sell, cashier, setCashier, onGoPrices }) {
  const active = useMemo(() => types.filter((type) => type.active), [types]);
  const [cart, setCart] = useState({});
  const [method, setMethod] = useState('efectivo');
  const [received, setReceived] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (!feedback) return undefined;
    const timer = setTimeout(() => setFeedback(null), 6000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const lines = active
    .filter((type) => (cart[type.id] ?? 0) > 0)
    .map((type) => ({
      ticket_type_id: type.id,
      name: type.name,
      unit_price: type.price,
      quantity: cart[type.id],
    }));
  const people = lines.reduce((sum, line) => sum + line.quantity, 0);
  const total = round2(lines.reduce((sum, line) => sum + line.unit_price * line.quantity, 0));
  const isCourtesy = people > 0 && total === 0;
  const receivedAmount = parseMoney(received);
  const change =
    method === 'efectivo' && total > 0 && receivedAmount !== null
      ? round2(receivedAmount - total)
      : null;

  const setQty = (id, qty) =>
    setCart((prev) => ({ ...prev, [id]: Math.max(0, Math.min(MAX_PEOPLE_PER_SALE, qty)) }));

  const clear = () => {
    setCart({});
    setReceived('');
  };

  const submit = async () => {
    if (!people || busy) return;
    setBusy(true);
    try {
      const result = await sell({ items: lines, payment_method: method, cashier });
      if (!result.ok) {
        setFeedback({ tone: 'error', text: Object.values(result.errors)[0] });
        return;
      }
      const label = `${people} ${people === 1 ? 'persona' : 'personas'} · ${formatPesos(total)}`;
      setFeedback(
        result.queued
          ? { tone: 'queued', text: `Guardada sin señal (${label}). Se sube sola al volver la conexión.` }
          : { tone: 'ok', text: `Entrada registrada: ${label}` },
      );
      clear();
      setMethod('efectivo');
    } finally {
      setBusy(false);
    }
  };

  if (!active.length) {
    return (
      <Panel>
        <EmptyState
          icon={Ticket}
          title="Todavía no hay precios de entrada"
          message="Da de alta los tipos de entrada (general, niños, cortesía…) con su precio para empezar a vender."
          action={
            <button type="button" className={BUTTON.primary} onClick={onGoPrices}>
              Configurar precios
            </button>
          }
        />
      </Panel>
    );
  }

  const quickCash = [total, ...QUICK_CASH.filter((value) => value > total)].slice(0, 4);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          {active.map((type) => {
            const qty = cart[type.id] ?? 0;
            return (
              <div
                key={type.id}
                className={`surface-card flex items-stretch border bg-[#141414] transition ${
                  qty ? 'border-racing-red' : 'border-white/10'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setQty(type.id, qty + 1)}
                  className="flex min-w-0 flex-1 flex-col items-start justify-center px-4 py-4 text-left"
                >
                  <span className="w-full truncate text-base font-semibold text-white">{type.name}</span>
                  <span className="mt-0.5 text-sm text-white/55">
                    {type.price ? formatPesos(type.price) : 'Cortesía · sin cobro'}
                  </span>
                </button>
                <div className="flex shrink-0 items-center gap-1 pr-3">
                  <button
                    type="button"
                    aria-label={`Quitar ${type.name}`}
                    disabled={!qty}
                    onClick={() => setQty(type.id, qty - 1)}
                    className="flex h-11 w-11 items-center justify-center border border-white/15 text-white/80 transition hover:border-white/40 disabled:opacity-30"
                  >
                    <Minus size={18} />
                  </button>
                  <span className="w-9 text-center text-xl font-semibold tabular-nums text-white">
                    {qty}
                  </span>
                  <button
                    type="button"
                    aria-label={`Agregar ${type.name}`}
                    onClick={() => setQty(type.id, qty + 1)}
                    className="flex h-11 w-11 items-center justify-center bg-racing-red text-white transition hover:brightness-110"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <label className="block max-w-sm text-xs uppercase tracking-[0.18em] text-white/45">
          Caja de este dispositivo
          <input
            className={`${INPUT} mt-1.5 normal-case tracking-normal`}
            value={cashier}
            onChange={(event) => setCashier(event.target.value)}
            placeholder="Ej. Caja 1"
            maxLength={40}
          />
          <span className="mt-1 block text-[11px] normal-case tracking-normal text-white/35">
            Sirve para el corte por caja cuando venden varios teléfonos a la vez.
          </span>
        </label>
      </div>

      <Panel
        title="Cobro"
        subtitle={cashier ? `Caja: ${cashier}` : 'Caja sin nombre'}
        className="lg:sticky lg:top-32"
      >
        {lines.length ? (
          <ul className="space-y-1.5">
            {lines.map((line) => (
              <li key={line.ticket_type_id} className="flex justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-white/70">
                  {line.quantity} × {line.name}
                </span>
                <span className="tabular-nums text-white">
                  {formatPesos(line.unit_price * line.quantity)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-white/40">Toca una entrada para agregarla.</p>
        )}

        <div className="mt-4 flex items-end justify-between gap-3 border-t border-white/10 pt-4">
          <div>
            <span className="text-xs uppercase tracking-[0.18em] text-white/45">Personas</span>
            <p className="text-3xl font-semibold tabular-nums text-white">{people}</p>
          </div>
          <div className="min-w-0 text-right">
            <span className="text-xs uppercase tracking-[0.18em] text-white/45">Total</span>
            <p className="break-words text-4xl font-semibold tabular-nums text-white">
              {formatPesos(total)}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <span className="block text-xs uppercase tracking-[0.18em] text-white/45">Forma de pago</span>
          {isCourtesy ? (
            <p className="mt-2 border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white/70">
              Cortesía: entra sin cobro.
            </p>
          ) : (
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {PAID_METHOD_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMethod(id)}
                  className={`border px-1 py-3 text-xs font-semibold transition ${
                    method === id
                      ? 'border-racing-red bg-racing-red/15 text-white'
                      : 'border-white/15 text-white/60 hover:border-white/40 hover:text-white'
                  }`}
                >
                  {PAYMENT_METHODS[id].label}
                </button>
              ))}
            </div>
          )}
        </div>

        {method === 'efectivo' && total > 0 && (
          <div className="mt-4">
            <label className="block text-xs uppercase tracking-[0.18em] text-white/45">
              Recibido (opcional)
              <input
                inputMode="decimal"
                className={`${INPUT} mt-1.5 text-lg tabular-nums`}
                value={received}
                onChange={(event) => setReceived(event.target.value)}
                placeholder={formatPesos(total)}
              />
            </label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {quickCash.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setReceived(String(value))}
                  className={`${BUTTON.subtle} border border-white/10`}
                >
                  {value === total ? 'Exacto' : formatPesos(value)}
                </button>
              ))}
            </div>
            {change !== null && (
              <p
                className={`mt-3 flex items-baseline justify-between text-sm ${
                  change < 0 ? 'text-racing-red' : 'text-white/70'
                }`}
              >
                <span>{change < 0 ? 'Falta' : 'Cambio'}</span>
                <span className={`text-2xl font-semibold tabular-nums ${change < 0 ? '' : 'text-white'}`}>
                  {formatPesos(Math.abs(change))}
                </span>
              </p>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={!people || busy}
          className={`${BUTTON.primary} mt-5 w-full py-4 text-base`}
        >
          <Ticket size={18} />
          {busy
            ? 'Registrando…'
            : people
              ? `Registrar ${people} ${people === 1 ? 'entrada' : 'entradas'}`
              : 'Registrar entrada'}
        </button>
        {lines.length > 0 && (
          <button type="button" onClick={clear} className={`${BUTTON.subtle} mt-2 w-full`}>
            <Trash2 size={13} /> Limpiar
          </button>
        )}

        {feedback && (
          <p
            role="status"
            className={`mt-4 flex items-start gap-2 border px-3 py-2.5 text-sm ${
              feedback.tone === 'ok'
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                : feedback.tone === 'queued'
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                  : 'border-racing-red/40 bg-racing-red/10 text-white'
            }`}
          >
            {feedback.tone === 'ok' && <CheckCircle2 size={16} className="mt-0.5 shrink-0" />}
            {feedback.tone === 'queued' && <CloudOff size={16} className="mt-0.5 shrink-0" />}
            {feedback.tone === 'error' && <AlertCircle size={16} className="mt-0.5 shrink-0 text-racing-red" />}
            {feedback.text}
          </p>
        )}
      </Panel>
    </div>
  );
}
