import { useMemo } from 'react';
import { Printer } from 'lucide-react';
import { CATEGORIES, STATUSES, formatMoney } from '../../../shared/participants';
import {
  byCategory,
  byCity,
  byDay,
  byEventDay,
  byStatus,
  formatDate,
  summarize,
} from '../../lib/adminData';
import { Bars, Columns, Legend, SegmentedBar } from './Charts';
import { BUTTON, Panel, StatTile } from './ui';

const STATUS_COLOR = {
  confirmado: '#22C55E',
  pendiente: '#C2891A',
  cancelado: '#71717A',
};

export default function ReportsView({ participants }) {
  const stats = useMemo(() => summarize(participants), [participants]);
  const categories = useMemo(() => byCategory(participants), [participants]);
  const days = useMemo(() => byDay(participants), [participants]);
  const cities = useMemo(() => byCity(participants), [participants]);
  const statuses = useMemo(() => byStatus(participants), [participants]);
  const eventDays = useMemo(() => byEventDay(participants), [participants]);

  const busiestDay = days.reduce((best, day) => (day.count > (best?.count ?? 0) ? day : best), null);
  const average = days.length ? (participants.length / days.length).toFixed(1) : '0';

  return (
    <div className="print-area space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="max-w-2xl text-sm text-white/45">
          Los totales operativos (vehículos, personas y cuotas) excluyen las inscripciones
          canceladas. El conteo de inscritos las incluye.
        </p>
        <button type="button" className={`${BUTTON.ghost} no-print`} onClick={() => window.print()}>
          <Printer size={16} /> Imprimir reporte
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Personas esperadas"
          value={stats.personas}
          hero
          hint={`${stats.vehiculos} vehículos · ${stats.copilotos} copilotos`}
        />
        <StatTile
          label="Inscritos totales"
          value={stats.total}
          hint={`${stats.confirmados} confirmados · ${stats.pendientes} pendientes`}
        />
        <StatTile
          label="Cuotas de inscripción"
          value={formatMoney(stats.cuotas)}
          hint="Drift no paga inscripción"
        />
        <StatTile
          label="Municipios representados"
          value={stats.ciudades}
          hint={
            cities[0]
              ? `${stats.estados} estados · encabeza ${cities[0].city}`
              : 'Sin registros'
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="Inscritos por categoría"
          subtitle="Cada barra es una categoría del evento"
        >
          <Bars
            rows={categories.map((category) => ({
              label: category.label,
              total: category.count,
              color: category.color,
            }))}
            unit="inscritos"
          />

          <table className="mt-6 w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-[0.12em] text-white/40">
                <th className="py-2 font-medium">Categoría</th>
                <th className="py-2 text-right font-medium">Inscritos</th>
                <th className="py-2 text-right font-medium">Personas</th>
                <th className="py-2 text-right font-medium">Cuotas</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className="border-b border-white/5">
                  <td className="py-2.5">
                    <span className="flex items-center gap-2 text-white">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: category.color }}
                        aria-hidden="true"
                      />
                      {category.label}
                    </span>
                    <span className="text-xs text-white/35">
                      {CATEGORIES[category.id].feeLabel} · {category.day}
                    </span>
                  </td>
                  <td className="py-2.5 text-right tabular-nums text-white">
                    {category.count}
                    <span className="ml-2 text-xs text-white/35">
                      {stats.total ? Math.round((category.count / stats.total) * 100) : 0}%
                    </span>
                  </td>
                  <td className="py-2.5 text-right tabular-nums text-white/70">
                    {category.personas}
                  </td>
                  <td className="py-2.5 text-right tabular-nums text-white/70">
                    {formatMoney(category.cuotas)}
                  </td>
                </tr>
              ))}
              <tr className="text-sm font-semibold">
                <td className="py-2.5 text-white">Total</td>
                <td className="py-2.5 text-right tabular-nums text-white">{stats.total}</td>
                <td className="py-2.5 text-right tabular-nums text-white">{stats.personas}</td>
                <td className="py-2.5 text-right tabular-nums text-white">
                  {formatMoney(stats.cuotas)}
                </td>
              </tr>
            </tbody>
          </table>
        </Panel>

        <div className="space-y-6">
          <Panel
            title="Registros por día"
            subtitle={
              busiestDay
                ? `Promedio ${average} al día · pico de ${busiestDay.count} el ${formatDate(`${busiestDay.key}T12:00:00`)}`
                : 'Sin registros todavía'
            }
          >
            <Columns points={days} color="#E10600" />
          </Panel>

          <Panel title="Estatus de las inscripciones" subtitle="Sobre el total de inscritos">
            <SegmentedBar
              total={stats.total}
              segments={statuses.map((status) => ({
                ...status,
                color: STATUS_COLOR[status.id] ?? '#71717A',
              }))}
            />
          </Panel>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="Procedencia de los participantes"
          subtitle="Municipio y estado de los vehículos activos, por categoría"
          action={
            <Legend
              items={Object.values(CATEGORIES).map((category) => ({
                label: category.label,
                color: category.chart,
              }))}
            />
          }
        >
          <Bars
            rows={cities.map((city) => ({
              label: city.city,
              total: city.total,
              segments: Object.values(CATEGORIES).map((category) => ({
                label: category.label,
                value: city[category.id],
                color: category.chart,
              })),
            }))}
            unit="vehículos"
            emptyLabel="Sin ciudades registradas"
          />
        </Panel>

        <Panel title="Carga por día de evento" subtitle="Cuánta gente esperar en cada jornada">
          <div className="grid gap-3 sm:grid-cols-2">
            {eventDays.map((day) => (
              <div key={day.label} className="surface-card border border-white/10 bg-[#0F0F0F] p-4">
                <span className="text-xs uppercase tracking-[0.18em] text-white/40">
                  {day.label}
                </span>
                <p className="mt-1 text-3xl font-semibold text-white">{day.personas}</p>
                <p className="text-xs text-white/40">personas en pista</p>
                <p className="mt-3 border-t border-white/10 pt-3 text-sm text-white/60">
                  {day.vehiculos} vehículos · {day.detail}
                </p>
              </div>
            ))}
          </div>

          <dl className="mt-4 space-y-2 text-sm">
            {[
              ['Vehículos con copiloto', `${stats.copilotos} de ${stats.vehiculos}`],
              [
                'Inscripciones canceladas',
                `${stats.cancelados} de ${stats.total}`,
              ],
              [
                'Pendientes por confirmar',
                `${stats.pendientes} de ${stats.total}`,
              ],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between border-b border-white/5 pb-2">
                <dt className="text-white/50">{label}</dt>
                <dd className="tabular-nums text-white">{value}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>

      <Panel title="Detalle por categoría y estatus" subtitle="Tabla completa para revisión rápida">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-[0.12em] text-white/40">
                <th className="py-2 font-medium">Categoría</th>
                {Object.values(STATUSES).map((status) => (
                  <th key={status.id} className="py-2 text-right font-medium">
                    {status.label}
                  </th>
                ))}
                <th className="py-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className="border-b border-white/5">
                  <td className="py-2.5 text-white">{category.label}</td>
                  <td className="py-2.5 text-right tabular-nums text-white/70">
                    {category.pendientes}
                  </td>
                  <td className="py-2.5 text-right tabular-nums text-white/70">
                    {category.confirmados}
                  </td>
                  <td className="py-2.5 text-right tabular-nums text-white/70">
                    {category.cancelados}
                  </td>
                  <td className="py-2.5 text-right tabular-nums font-semibold text-white">
                    {category.count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
