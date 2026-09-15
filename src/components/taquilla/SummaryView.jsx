import { useMemo, useState } from 'react';
import { Download, Loader2, Printer } from 'lucide-react';
import { Bars } from '../admin/Charts';
import { BUTTON, Panel } from '../admin/ui';
import KpiTile from './KpiTile';
import { formatPesos, formatSaleDay, saleDays, summarizeSales } from '../../../shared/taquilla';
import { downloadTaquillaExcel } from '../../lib/taquillaExport';

const TRACK = 'rgba(255,255,255,0.07)';

export default function SummaryView({ sales }) {
  const days = useMemo(() => saleDays(sales), [sales]);
  const [day, setDay] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const stats = useMemo(() => summarizeSales(sales, { day }), [sales, day]);
  const methodTop = Math.max(1, ...stats.byMethod.map((method) => method.total));
  const scopeLabel = day ? formatSaleDay(day) : 'Todo el evento';

  const exportExcel = async () => {
    setExporting(true);
    setExportError('');
    try {
      await downloadTaquillaExcel(sales, { day });
    } catch (err) {
      setExportError(err.message || 'No se pudo generar el Excel.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="print-area space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="no-print -mx-4 flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden">
          {[{ key: '', label: 'Todo el evento' }, ...days.map((key) => ({ key, label: formatSaleDay(key) }))].map(
            (option) => (
              <button
                key={option.key || 'todo'}
                type="button"
                onClick={() => setDay(option.key)}
                className={`shrink-0 border px-3 py-1.5 text-xs uppercase tracking-[0.15em] transition ${
                  day === option.key
                    ? 'border-racing-red bg-racing-red/15 text-white'
                    : 'border-white/15 text-white/60 hover:border-white/40 hover:text-white'
                }`}
              >
                {option.label}
              </button>
            ),
          )}
        </div>
        <div className="no-print flex gap-2">
          <button
            type="button"
            className={BUTTON.ghost}
            onClick={exportExcel}
            disabled={exporting || !sales.length}
          >
            {exporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
            Excel
          </button>
          <button type="button" className={BUTTON.ghost} onClick={() => window.print()}>
            <Printer size={15} /> Imprimir
          </button>
        </div>
      </div>

      <h2 className="display hidden text-2xl uppercase print:block">Corte de taquilla · {scopeLabel}</h2>
      {exportError && <p className="text-sm text-racing-red">{exportError}</p>}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <KpiTile
          label="Personas"
          value={stats.personas.toLocaleString('es-MX')}
          hero
          hint={`${stats.cortesias} con cortesía`}
        />
        <KpiTile label="Recaudado" value={formatPesos(stats.total)} hint={`${stats.ventas} ventas`} />
        <KpiTile
          label="Efectivo en caja"
          value={formatPesos(stats.efectivo)}
          accent="#22C55E"
          hint="Lo que debe cuadrar al contar"
        />
        <KpiTile
          label="Venta promedio"
          value={formatPesos(stats.promedio)}
          hint={
            stats.anuladas
              ? `${stats.anuladas} anulada${stats.anuladas === 1 ? '' : 's'} · ${formatPesos(stats.totalAnulado)} fuera del corte`
              : 'Sin ventas anuladas'
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Por tipo de entrada" subtitle="Personas que entraron con cada entrada">
          <Bars
            rows={stats.byType.map((type) => ({ label: type.label, total: type.personas, color: '#E10600' }))}
            unit="personas"
            emptyLabel="Sin ventas todavía"
          />
          {stats.byType.length > 0 && (
            <table className="mt-6 w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-[0.12em] text-white/40">
                  <th className="py-2 font-medium">Entrada</th>
                  <th className="py-2 text-right font-medium">Personas</th>
                  <th className="py-2 text-right font-medium">Recaudado</th>
                </tr>
              </thead>
              <tbody>
                {stats.byType.map((type) => (
                  <tr key={type.label} className="border-b border-white/5">
                    <td className="py-2.5 text-white">{type.label}</td>
                    <td className="py-2.5 text-right tabular-nums text-white/70">{type.personas}</td>
                    <td className="py-2.5 text-right tabular-nums text-white/70">{formatPesos(type.total)}</td>
                  </tr>
                ))}
                <tr className="font-semibold">
                  <td className="py-2.5 text-white">Total</td>
                  <td className="py-2.5 text-right tabular-nums text-white">{stats.personas}</td>
                  <td className="py-2.5 text-right tabular-nums text-white">{formatPesos(stats.total)}</td>
                </tr>
              </tbody>
            </table>
          )}
        </Panel>

        <Panel title="Por forma de pago" subtitle="Cuánto entró por cada vía">
          <ul className="space-y-4">
            {stats.byMethod.map((method) => (
              <li key={method.id}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 text-white/80">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: method.color }}
                      aria-hidden="true"
                    />
                    {method.label}
                  </span>
                  <span className="tabular-nums text-white">{formatPesos(method.total)}</span>
                </div>
                <div className="mt-1.5 h-2" style={{ background: TRACK }}>
                  {method.total > 0 && (
                    <div
                      className="h-full"
                      style={{
                        width: `${(method.total / methodTop) * 100}%`,
                        background: method.color,
                        borderTopRightRadius: 4,
                        borderBottomRightRadius: 4,
                      }}
                    />
                  )}
                </div>
                <p className="mt-1 text-xs text-white/40">
                  {method.ventas} ventas · {method.personas} personas
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Entradas por hora" subtitle="Hora de Puerto Peñasco">
          <Bars
            rows={stats.byHour.map((hour) => ({ label: hour.label, total: hour.personas, color: '#E10600' }))}
            unit="personas"
            emptyLabel="Sin ventas todavía"
          />
        </Panel>

        <Panel title="Corte por caja" subtitle="Cada teléfono que vendió, con su efectivo">
          {stats.byCashier.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-xs uppercase tracking-[0.12em] text-white/40">
                    <th className="py-2 font-medium">Caja</th>
                    <th className="py-2 text-right font-medium">Ventas</th>
                    <th className="py-2 text-right font-medium">Personas</th>
                    <th className="py-2 text-right font-medium">Efectivo</th>
                    <th className="py-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.byCashier.map((row) => (
                    <tr key={row.label} className="border-b border-white/5">
                      <td className="py-2.5 text-white">{row.label}</td>
                      <td className="py-2.5 text-right tabular-nums text-white/70">{row.ventas}</td>
                      <td className="py-2.5 text-right tabular-nums text-white/70">{row.personas}</td>
                      <td className="py-2.5 text-right tabular-nums text-white/70">{formatPesos(row.efectivo)}</td>
                      <td className="py-2.5 text-right tabular-nums font-semibold text-white">
                        {formatPesos(row.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-white/35">Sin ventas todavía</p>
          )}
        </Panel>
      </div>
    </div>
  );
}
