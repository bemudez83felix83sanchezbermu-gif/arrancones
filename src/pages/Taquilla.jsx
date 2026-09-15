import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  CloudOff,
  ListChecks,
  Loader2,
  LogIn,
  RefreshCw,
  Tags,
  Ticket,
  Wifi,
} from 'lucide-react';
import { EVENT } from '../data/event';
import { useAuth } from '../lib/useAuth';
import { useTaquilla } from '../lib/useTaquilla';
import { Link, navigate } from '../router';
import { BUTTON } from '../components/admin/ui';
import KpiTile from '../components/taquilla/KpiTile';
import SellView from '../components/taquilla/SellView';
import SummaryView from '../components/taquilla/SummaryView';
import SalesView from '../components/taquilla/SalesView';
import PricesView from '../components/taquilla/PricesView';
import { formatPesos, formatSaleTime, saleDayKey, summarizeSales } from '../../shared/taquilla';

const TABS = [
  { id: 'vender', label: 'Vender', icon: Ticket },
  { id: 'corte', label: 'Corte de caja', icon: BarChart3 },
  { id: 'ventas', label: 'Ventas', icon: ListChecks },
  { id: 'precios', label: 'Precios', icon: Tags },
];

export default function Taquilla() {
  const { status } = useAuth();

  useEffect(() => {
    if (status === 'anon') navigate('/login');
  }, [status]);

  // Sin señal se deja operar: la sesión se vuelve a validar al subir cada venta.
  if (status !== 'authed' && status !== 'offline') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A]">
        <Loader2 size={32} className="animate-spin text-racing-red" />
      </div>
    );
  }

  return <TaquillaPanel />;
}

function TaquillaPanel() {
  const taquilla = useTaquilla();
  const {
    sales,
    types,
    loading,
    error,
    offline,
    syncing,
    pendingCount,
    failedCount,
    sessionExpired,
    syncedAt,
    refresh,
    flush,
  } = taquilla;
  const [tab, setTab] = useState('vender');

  // Una venta que el servidor rechazó no cuenta hasta que se revise.
  const countable = useMemo(() => sales.filter((sale) => !sale.failed), [sales]);
  const totals = useMemo(() => summarizeSales(countable), [countable]);
  const today = saleDayKey(new Date());
  const todayTotals = useMemo(() => summarizeSales(countable, { day: today }), [countable, today]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <header className="no-print sticky top-0 z-40 border-b border-white/10 bg-[#0A0A0A]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link to="/admin" className={`${BUTTON.ghost} shrink-0`} title="Volver al panel">
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">Panel</span>
            </Link>
            <div className="min-w-0">
              <span className="display block text-lg uppercase leading-tight tracking-wide text-white sm:text-2xl">
                Taquilla <span className="text-racing-red">{EVENT.name}</span>
              </span>
              <p className="mt-0.5 truncate text-[10px] uppercase tracking-[0.2em] text-white/35 sm:text-xs">
                Entradas y dinero recaudado · {EVENT.displayDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ConnectionBadge
              offline={offline}
              syncing={syncing}
              pendingCount={pendingCount}
              failedCount={failedCount}
              syncedAt={syncedAt}
            />
            <button
              type="button"
              className={`${BUTTON.ghost} shrink-0`}
              onClick={() => {
                flush();
                refresh({ silent: true });
              }}
              title="Actualizar"
            >
              <RefreshCw size={15} className={syncing ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
          </div>
        </div>

        <nav className="mx-auto flex max-w-[1400px] gap-1 overflow-x-auto px-4 [scrollbar-width:none] md:px-8 [&::-webkit-scrollbar]:hidden">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
                tab === id
                  ? 'border-racing-red text-white'
                  : 'border-transparent text-white/45 hover:text-white'
              }`}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
        {sessionExpired && (
          <div className="no-print mb-4 flex flex-wrap items-center gap-3 border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-white">
            <AlertCircle size={18} className="shrink-0 text-amber-300" />
            <span className="min-w-0 flex-1">
              Tu sesión expiró. Las ventas guardadas en este teléfono no se pierden: inicia
              sesión y se suben solas.
            </span>
            <Link to="/login" className={BUTTON.ghost}>
              <LogIn size={14} /> Iniciar sesión
            </Link>
          </div>
        )}

        {error && (
          <p className="no-print mb-4 flex items-center gap-2 border border-racing-red/40 bg-racing-red/10 px-4 py-3 text-sm text-white">
            <AlertCircle size={18} className="shrink-0 text-racing-red" />
            <span className="min-w-0 flex-1">{error}</span>
            <button type="button" className={BUTTON.subtle} onClick={() => refresh()}>
              Reintentar
            </button>
          </p>
        )}

        <div className="no-print mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
          <KpiTile
            label="Personas que entraron"
            value={totals.personas.toLocaleString('es-MX')}
            hero
            hint={`${totals.ventas} ventas · ${totals.cortesias} cortesías`}
          />
          <KpiTile
            label="Dinero recaudado"
            value={formatPesos(totals.total)}
            hint={`Efectivo: ${formatPesos(totals.efectivo)}`}
          />
          <div className="col-span-2 lg:col-span-1">
            <KpiTile
              label="Hoy"
              value={formatPesos(todayTotals.total)}
              hint={`${todayTotals.personas} personas · ${todayTotals.ventas} ventas`}
            />
          </div>
        </div>

        {loading && !types.length && !sales.length ? (
          <div className="flex justify-center py-20">
            <Loader2 size={32} className="animate-spin text-racing-red" />
          </div>
        ) : (
          <>
            {tab === 'vender' && (
              <SellView
                types={types}
                sell={taquilla.sell}
                cashier={taquilla.cashier}
                setCashier={taquilla.setCashier}
                onGoPrices={() => setTab('precios')}
              />
            )}
            {tab === 'corte' && <SummaryView sales={countable} />}
            {tab === 'ventas' && (
              <SalesView
                sales={sales}
                offline={offline}
                onVoid={taquilla.voidSale}
                onRestore={taquilla.restoreSale}
                onDiscard={taquilla.discardPending}
              />
            )}
            {tab === 'precios' && (
              <PricesView
                types={types}
                offline={offline}
                onAdd={taquilla.addType}
                onEdit={taquilla.editType}
                onRemove={taquilla.removeType}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

const BADGE = 'inline-flex items-center gap-1.5 whitespace-nowrap border px-2.5 py-1.5 text-xs font-medium';

function ConnectionBadge({ offline, syncing, pendingCount, failedCount, syncedAt }) {
  if (offline) {
    return (
      <span className={`${BADGE} border-amber-500/40 bg-amber-500/10 text-amber-300`}>
        <CloudOff size={14} />
        Sin señal{pendingCount ? ` · ${pendingCount} por subir` : ''}
      </span>
    );
  }
  if (syncing || pendingCount) {
    return (
      <span className={`${BADGE} border-white/15 bg-white/5 text-white/70`}>
        <Loader2 size={14} className="animate-spin" />
        Subiendo{pendingCount ? ` ${pendingCount}` : ''}
      </span>
    );
  }
  if (failedCount) {
    return (
      <span className={`${BADGE} border-racing-red/40 bg-racing-red/10 text-white`}>
        <AlertCircle size={14} className="text-racing-red" />
        {failedCount} sin subir
      </span>
    );
  }
  return (
    <span className={`${BADGE} border-emerald-500/30 bg-emerald-500/10 text-emerald-300`}>
      <Wifi size={14} />
      En línea
      {syncedAt && (
        <span className="hidden text-emerald-300/60 sm:inline">
          · {formatSaleTime(syncedAt)}
        </span>
      )}
    </span>
  );
}
