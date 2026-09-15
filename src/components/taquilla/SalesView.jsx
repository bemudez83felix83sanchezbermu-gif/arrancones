import { useMemo, useState } from 'react';
import { Ban, ListChecks, RotateCcw, Trash2 } from 'lucide-react';
import { BUTTON, EmptyState, INPUT, Modal, Panel } from '../admin/ui';
import {
  PAYMENT_METHODS,
  describeItems,
  formatPesos,
  formatSaleDay,
  formatSaleTime,
  isVoided,
  saleDayKey,
  saleFolio,
} from '../../../shared/taquilla';

const FILTERS = [
  { id: 'todas', label: 'Todas', test: () => true },
  { id: 'validas', label: 'Válidas', test: (sale) => !isVoided(sale) && !sale.failed },
  { id: 'anuladas', label: 'Anuladas', test: isVoided },
  { id: 'pendientes', label: 'Por subir', test: (sale) => Boolean(sale.pending) },
];

const PAGE = 50;

export default function SalesView({ sales, offline, onVoid, onRestore, onDiscard }) {
  const [filter, setFilter] = useState('todas');
  const [limit, setLimit] = useState(PAGE);
  const [voiding, setVoiding] = useState(null);
  const [discarding, setDiscarding] = useState(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const counts = useMemo(
    () => Object.fromEntries(FILTERS.map((f) => [f.id, sales.filter(f.test).length])),
    [sales],
  );
  const filtered = useMemo(
    () => sales.filter(FILTERS.find((f) => f.id === filter).test),
    [sales, filter],
  );

  const confirmVoid = async () => {
    setBusy(true);
    setError('');
    try {
      await onVoid(voiding.id, reason);
      setVoiding(null);
      setReason('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const restore = async (sale) => {
    setError('');
    try {
      await onRestore(sale.id);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden">
        {FILTERS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => {
              setFilter(option.id);
              setLimit(PAGE);
            }}
            className={`shrink-0 border px-3 py-1.5 text-xs uppercase tracking-[0.15em] transition ${
              filter === option.id
                ? 'border-racing-red bg-racing-red/15 text-white'
                : 'border-white/15 text-white/60 hover:border-white/40 hover:text-white'
            }`}
          >
            {option.label}
            <span className="ml-1.5 text-white/40">{counts[option.id]}</span>
          </button>
        ))}
      </div>

      {error && !voiding && (
        <p className="border border-racing-red/40 bg-racing-red/10 px-4 py-3 text-sm text-white">{error}</p>
      )}

      <Panel className="[&>div]:p-0">
        {filtered.length ? (
          <ul>
            {filtered.slice(0, limit).map((sale) => {
              const voided = isVoided(sale);
              const method = PAYMENT_METHODS[sale.payment_method];
              return (
                <li
                  key={sale.client_id}
                  className="grid gap-3 border-b border-white/5 px-5 py-4 last:border-b-0 sm:grid-cols-[120px_1fr_auto] sm:items-center"
                >
                  <div className="flex items-baseline gap-2 sm:block">
                    <p className="text-lg font-semibold tabular-nums text-white">
                      {formatSaleTime(sale.sold_at)}
                    </p>
                    <p className="text-xs text-white/40">
                      {formatSaleDay(saleDayKey(sale.sold_at))} ·{' '}
                      {sale.pending ? 'Por subir' : saleFolio(sale.id)}
                    </p>
                  </div>

                  <div className={`min-w-0 ${voided ? 'opacity-60' : ''}`}>
                    <p className={`text-sm text-white ${voided ? 'line-through' : ''}`}>
                      {describeItems(sale)}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/45">
                      <span>
                        {sale.people} {sale.people === 1 ? 'persona' : 'personas'}
                      </span>
                      {method && (
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ background: method.color }}
                            aria-hidden="true"
                          />
                          {method.label}
                        </span>
                      )}
                      {sale.cashier && <span>{sale.cashier}</span>}
                      {voided && (
                        <span className="text-racing-red">
                          Anulada{sale.void_reason ? `: ${sale.void_reason}` : ''}
                        </span>
                      )}
                      {sale.pending && !sale.failed && <span className="text-amber-300">Guardada en este teléfono</span>}
                      {sale.failed && <span className="text-racing-red">No se pudo subir: {sale.failed}</span>}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <span
                      className={`text-lg font-semibold tabular-nums ${voided ? 'text-white/40 line-through' : 'text-white'}`}
                    >
                      {formatPesos(sale.total)}
                    </span>
                    {sale.pending ? (
                      <button type="button" className={BUTTON.subtle} onClick={() => setDiscarding(sale)}>
                        <Trash2 size={13} /> Descartar
                      </button>
                    ) : voided ? (
                      <button
                        type="button"
                        className={BUTTON.subtle}
                        onClick={() => restore(sale)}
                        disabled={offline}
                        title={offline ? 'Necesitas conexión' : 'Volver a contar esta venta'}
                      >
                        <RotateCcw size={13} /> Restaurar
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={BUTTON.subtle}
                        onClick={() => {
                          setError('');
                          setReason('');
                          setVoiding(sale);
                        }}
                        disabled={offline}
                        title={offline ? 'Necesitas conexión' : 'Anular por error de captura o devolución'}
                      >
                        <Ban size={13} /> Anular
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            icon={ListChecks}
            title={sales.length ? 'Nada con este filtro' : 'Aún no hay ventas'}
            message={sales.length ? undefined : 'Cada entrada que registres en “Vender” aparece aquí.'}
          />
        )}
      </Panel>

      {filtered.length > limit && (
        <button type="button" className={`${BUTTON.ghost} w-full`} onClick={() => setLimit(limit + PAGE)}>
          Ver {Math.min(PAGE, filtered.length - limit)} más
        </button>
      )}

      <Modal
        open={Boolean(voiding)}
        onClose={() => setVoiding(null)}
        title="Anular venta"
        subtitle={voiding ? `${describeItems(voiding)} · ${formatPesos(voiding.total)}` : ''}
      >
        <p className="text-sm text-white/70">
          La venta deja de contar en personas y dinero, pero queda en el historial. Puedes
          restaurarla después.
        </p>
        <label className="mt-4 block text-xs uppercase tracking-[0.18em] text-white/45">
          Motivo (opcional)
          <textarea
            className={`${INPUT} mt-1.5 min-h-[80px] normal-case tracking-normal`}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={200}
            placeholder="Ej. se capturó doble, devolución"
          />
        </label>
        {error && <p className="mt-3 text-sm text-racing-red">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className={BUTTON.ghost} onClick={() => setVoiding(null)}>
            Cancelar
          </button>
          <button type="button" className={BUTTON.danger} onClick={confirmVoid} disabled={busy}>
            {busy ? 'Anulando…' : 'Anular venta'}
          </button>
        </div>
      </Modal>

      <Modal open={Boolean(discarding)} onClose={() => setDiscarding(null)} title="Descartar venta">
        <p className="text-sm text-white/70">
          Esta venta solo está guardada en este teléfono y todavía no llega al servidor. Si la
          descartas se pierde y no cuenta en el corte.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className={BUTTON.ghost} onClick={() => setDiscarding(null)}>
            Cancelar
          </button>
          <button
            type="button"
            className={BUTTON.danger}
            onClick={() => {
              onDiscard(discarding.client_id);
              setDiscarding(null);
            }}
          >
            Descartar
          </button>
        </div>
      </Modal>
    </div>
  );
}
