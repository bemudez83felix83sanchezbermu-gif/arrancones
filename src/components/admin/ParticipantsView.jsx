import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileSpreadsheet,
  FileText,
  MessageCircle,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  UserX,
  X,
} from 'lucide-react';
import {
  ARRANCONES_CLASSES,
  CATEGORIES,
  STATUSES,
  folio,
  formatMoney,
  formatPhone,
  raceClassLabel,
  socialLabel,
  socialLink,
} from '../../../shared/participants';
import {
  EMPTY_FILTERS,
  filterParticipants,
  formatDate,
  formatDateTime,
  hasActiveFilters,
  sortParticipants,
  summarize,
  uniqueCities,
  uniqueStates,
} from '../../lib/adminData';
import { downloadExcel, downloadPdf } from '../../lib/exports';
import ParticipantForm from './ParticipantForm';
import {
  BUTTON,
  CategoryBadge,
  ConfirmDialog,
  EmptyState,
  INPUT,
  Modal,
  StatTile,
  StatusBadge,
} from './ui';

const PAGE_SIZES = [25, 50, 100];

const COLUMNS = [
  { key: 'id', label: 'Folio', sortable: true },
  { key: 'pilot_name', label: 'Piloto', sortable: true },
  { key: 'vehicle_name', label: 'Vehículo', sortable: true },
  { key: 'category', label: 'Categoría', sortable: true },
  { key: 'city', label: 'Municipio', sortable: true },
  { key: 'phone', label: 'WhatsApp', sortable: false },
  { key: 'status', label: 'Estatus', sortable: true },
  { key: 'created_at', label: 'Registro', sortable: true },
];

function Chip({ active, color, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs font-medium transition ${
        active
          ? 'border-white/40 bg-white/10 text-white'
          : 'border-white/12 text-white/50 hover:border-white/30 hover:text-white'
      }`}
    >
      {color && (
        <span className="h-2 w-2 rounded-full" style={{ background: color }} aria-hidden="true" />
      )}
      {children}
    </button>
  );
}

export default function ParticipantsView({ participants, loading, onCreate, onUpdate, onDelete }) {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState({ key: 'created_at', direction: 'desc' });
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [detail, setDetail] = useState(null);
  const [editing, setEditing] = useState(undefined); // undefined = cerrado, null = alta nueva
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(null); // 'excel' | 'pdf' | null

  const runExport = async (kind, rowsToExport, name) => {
    if (!rowsToExport.length) return;
    setExporting(kind);
    try {
      const handler = kind === 'excel' ? downloadExcel : downloadPdf;
      await handler(rowsToExport, name);
    } catch (error) {
      console.error(`No se pudo exportar como ${kind}`, error);
      alert(`No se pudo generar el archivo ${kind === 'excel' ? 'Excel' : 'PDF'}.`);
    } finally {
      setExporting(null);
    }
  };

  const states = useMemo(() => uniqueStates(participants), [participants]);
  const cities = useMemo(
    () =>
      uniqueCities(
        filters.state ? participants.filter((row) => row.state === filters.state) : participants,
      ),
    [participants, filters.state],
  );

  const filtered = useMemo(
    () => sortParticipants(filterParticipants(participants, filters), sort.key, sort.direction),
    [participants, filters, sort],
  );

  const stats = useMemo(() => summarize(filtered), [filtered]);

  useEffect(() => setPage(1), [filters, pageSize]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pageCount);
  const visible = filtered.slice((current - 1) * pageSize, current * pageSize);

  const setFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));
  const toggleInArray = (key, value) =>
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((item) => item !== value)
        : [...prev[key], value],
    }));

  const toggleSort = (key) =>
    setSort((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: key === 'created_at' ? 'desc' : 'asc' },
    );

  const allVisibleSelected = visible.length > 0 && visible.every((row) => selected.includes(row.id));
  const toggleSelectAll = () =>
    setSelected((prev) =>
      allVisibleSelected
        ? prev.filter((id) => !visible.some((row) => row.id === id))
        : [...new Set([...prev, ...visible.map((row) => row.id)])],
    );

  const applyStatus = async (ids, status) => {
    setBusy(true);
    try {
      for (const id of ids) await onUpdate(id, { status });
      setSelected([]);
    } finally {
      setBusy(false);
    }
  };

  const removeIds = async (ids) => {
    setBusy(true);
    try {
      await onDelete(ids);
      setSelected((prev) => prev.filter((id) => !ids.includes(id)));
      setConfirm(null);
      setDetail(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatTile
          label="Inscritos"
          value={stats.total}
          hero
          hint={`${stats.confirmados} confirmados · ${stats.pendientes} pendientes`}
        />
        <StatTile
          label="Vehículos en pista"
          value={stats.vehiculos}
          hint={`${stats.cancelados} cancelados fuera del conteo`}
        />
        <StatTile
          label="Personas"
          value={stats.personas}
          hint={`${stats.copilotos} copilotos registrados`}
        />
        <StatTile label="Ciudades" value={stats.ciudades} hint="Origen de los participantes" />
        <StatTile
          label="Cuotas de inscripción"
          value={formatMoney(stats.cuotas)}
          hint="Suma teórica por categoría, sin control de pagos"
        />
      </div>

      <div className="border border-white/10 bg-[#141414]">
        <div className="flex flex-wrap items-center gap-3 border-b border-white/10 p-4">
          <div className="relative min-w-[220px] flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              className={`${INPUT} pl-9`}
              placeholder="Buscar piloto, copiloto, vehículo, folio o teléfono…"
              value={filters.q}
              onChange={(event) => setFilter('q', event.target.value)}
            />
          </div>

          <button
            type="button"
            onClick={() => setShowFilters((value) => !value)}
            className={`${BUTTON.ghost} ${showFilters ? 'border-white/40 text-white' : ''}`}
          >
            <SlidersHorizontal size={16} /> Filtros
          </button>
          <button
            type="button"
            className={BUTTON.ghost}
            onClick={() => runExport('excel', filtered, 'participantes-carfest')}
            disabled={!filtered.length || Boolean(exporting)}
            title="Descargar como archivo Excel (.xlsx)"
          >
            <FileSpreadsheet size={16} /> {exporting === 'excel' ? 'Generando…' : 'Excel'}
          </button>
          <button
            type="button"
            className={BUTTON.ghost}
            onClick={() => runExport('pdf', filtered, 'participantes-carfest')}
            disabled={!filtered.length || Boolean(exporting)}
            title="Descargar como archivo PDF"
          >
            <FileText size={16} /> {exporting === 'pdf' ? 'Generando…' : 'PDF'}
          </button>
          <button type="button" className={BUTTON.primary} onClick={() => setEditing(null)}>
            <Plus size={16} /> Agregar
          </button>
        </div>

        {showFilters && (
          <div className="space-y-4 border-b border-white/10 bg-white/[0.02] p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-xs uppercase tracking-[0.18em] text-white/35">
                Categoría
              </span>
              {Object.values(CATEGORIES).map((category) => (
                <Chip
                  key={category.id}
                  color={category.chart}
                  active={filters.categories.includes(category.id)}
                  onClick={() => toggleInArray('categories', category.id)}
                >
                  {category.label}
                </Chip>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-xs uppercase tracking-[0.18em] text-white/35">Estatus</span>
              {Object.values(STATUSES).map((status) => (
                <Chip
                  key={status.id}
                  active={filters.statuses.includes(status.id)}
                  onClick={() => toggleInArray('statuses', status.id)}
                >
                  {status.label}
                </Chip>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-xs uppercase tracking-[0.18em] text-white/35">
                Clase arrancones
              </span>
              {Object.values(ARRANCONES_CLASSES).map((klass) => (
                <Chip
                  key={klass.id}
                  active={filters.race_classes.includes(klass.id)}
                  onClick={() => toggleInArray('race_classes', klass.id)}
                >
                  {klass.label}
                </Chip>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <label className="block">
                <span className="text-xs uppercase tracking-[0.15em] text-white/35">Estado</span>
                <select
                  className={`${INPUT} mt-1.5`}
                  value={filters.state}
                  onChange={(event) =>
                    setFilters((prev) => ({ ...prev, state: event.target.value, city: '' }))
                  }
                >
                  <option value="">Todos</option>
                  {states.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs uppercase tracking-[0.15em] text-white/35">Municipio</span>
                <select
                  className={`${INPUT} mt-1.5`}
                  value={filters.city}
                  onChange={(event) => setFilter('city', event.target.value)}
                >
                  <option value="">Todos</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs uppercase tracking-[0.15em] text-white/35">Copiloto</span>
                <select
                  className={`${INPUT} mt-1.5`}
                  value={filters.copilot}
                  onChange={(event) => setFilter('copilot', event.target.value)}
                >
                  <option value="todos">Todos</option>
                  <option value="con">Con copiloto</option>
                  <option value="sin">Sin copiloto</option>
                </select>
              </label>

              <label className="block">
                <span className="text-xs uppercase tracking-[0.15em] text-white/35">Desde</span>
                <input
                  type="date"
                  className={`${INPUT} mt-1.5`}
                  value={filters.from}
                  onChange={(event) => setFilter('from', event.target.value)}
                />
              </label>

              <label className="block">
                <span className="text-xs uppercase tracking-[0.15em] text-white/35">Hasta</span>
                <input
                  type="date"
                  className={`${INPUT} mt-1.5`}
                  value={filters.to}
                  onChange={(event) => setFilter('to', event.target.value)}
                />
              </label>
            </div>

            {hasActiveFilters(filters) && (
              <button
                type="button"
                className={BUTTON.subtle}
                onClick={() => setFilters(EMPTY_FILTERS)}
              >
                <X size={14} /> Limpiar filtros
              </button>
            )}
          </div>
        )}

        {selected.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 border-b border-white/10 bg-racing-red/10 px-4 py-3">
            <span className="text-sm font-medium text-white">
              {selected.length} seleccionado{selected.length > 1 ? 's' : ''}
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={BUTTON.subtle}
                disabled={busy}
                onClick={() => applyStatus(selected, 'confirmado')}
              >
                Confirmar
              </button>
              <button
                type="button"
                className={BUTTON.subtle}
                disabled={busy}
                onClick={() => applyStatus(selected, 'pendiente')}
              >
                Marcar pendiente
              </button>
              <button
                type="button"
                className={BUTTON.subtle}
                disabled={busy}
                onClick={() => applyStatus(selected, 'cancelado')}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={BUTTON.subtle}
                disabled={Boolean(exporting)}
                onClick={() =>
                  runExport(
                    'excel',
                    filtered.filter((row) => selected.includes(row.id)),
                    'seleccion-carfest',
                  )
                }
              >
                <FileSpreadsheet size={14} /> Excel
              </button>
              <button
                type="button"
                className={BUTTON.subtle}
                disabled={Boolean(exporting)}
                onClick={() =>
                  runExport(
                    'pdf',
                    filtered.filter((row) => selected.includes(row.id)),
                    'seleccion-carfest',
                  )
                }
              >
                <FileText size={14} /> PDF
              </button>
              <button
                type="button"
                className={`${BUTTON.subtle} text-racing-red hover:bg-racing-red/20`}
                onClick={() =>
                  setConfirm({
                    ids: selected,
                    message: `Se eliminarán ${selected.length} registros de forma permanente. Esta acción no se puede deshacer.`,
                  })
                }
              >
                <Trash2 size={14} /> Eliminar
              </button>
            </div>
            <button type="button" className={`${BUTTON.subtle} ml-auto`} onClick={() => setSelected([])}>
              Quitar selección
            </button>
          </div>
        )}

        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-12 animate-pulse bg-white/5" />
            ))}
          </div>
        ) : !participants.length ? (
          <EmptyState
            icon={UserX}
            title="Todavía no hay inscritos"
            message="Cuando alguien llene el formulario de registro aparecerá aquí. También puedes darlo de alta a mano."
            action={
              <button type="button" className={`${BUTTON.primary} mt-2`} onClick={() => setEditing(null)}>
                <Plus size={16} /> Agregar participante
              </button>
            }
          />
        ) : !filtered.length ? (
          <EmptyState
            icon={Search}
            title="Ningún participante coincide"
            message="Prueba con otros filtros o limpia la búsqueda."
            action={
              <button
                type="button"
                className={`${BUTTON.ghost} mt-2`}
                onClick={() => setFilters(EMPTY_FILTERS)}
              >
                Limpiar filtros
              </button>
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-xs uppercase tracking-[0.12em] text-white/40">
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 accent-racing-red"
                        aria-label="Seleccionar todos"
                      />
                    </th>
                    {COLUMNS.map((column) => (
                      <th key={column.key} className="px-3 py-3 font-medium">
                        {column.sortable ? (
                          <button
                            type="button"
                            onClick={() => toggleSort(column.key)}
                            className="inline-flex items-center gap-1 transition hover:text-white"
                          >
                            {column.label}
                            {sort.key === column.key &&
                              (sort.direction === 'asc' ? (
                                <ArrowUp size={12} />
                              ) : (
                                <ArrowDown size={12} />
                              ))}
                          </button>
                        ) : (
                          column.label
                        )}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((row) => (
                    <tr
                      key={row.id}
                      className={`border-b border-white/5 transition hover:bg-white/[0.03] ${
                        row.status === 'cancelado' ? 'opacity-55' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.includes(row.id)}
                          onChange={() =>
                            setSelected((prev) =>
                              prev.includes(row.id)
                                ? prev.filter((id) => id !== row.id)
                                : [...prev, row.id],
                            )
                          }
                          className="h-4 w-4 accent-racing-red"
                          aria-label={`Seleccionar ${row.pilot_name}`}
                        />
                      </td>
                      <td className="px-3 py-3 font-mono text-xs text-white/50">{folio(row.id)}</td>
                      <td className="px-3 py-3">
                        <span className="font-medium text-white">{row.pilot_name}</span>
                        {row.copilot_name && (
                          <span className="block text-xs text-white/40">
                            Copiloto: {row.copilot_name}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-white/80">{row.vehicle_name}</td>
                      <td className="px-3 py-3">
                        <CategoryBadge id={row.category} />
                        {row.race_class && (
                          <span className="mt-1 block text-[11px] uppercase tracking-wider text-white/45">
                            {raceClassLabel(row.race_class)}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-white/80">{row.city}</span>
                        {row.state && (
                          <span className="block text-xs text-white/35">{row.state}</span>
                        )}
                      </td>
                      <td className="px-3 py-3 tabular-nums text-white/70">
                        {formatPhone(row.phone)}
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge id={row.status} />
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-white/50">
                        {formatDate(row.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <a
                            href={`https://wa.me/${row.phone.length === 10 ? `52${row.phone}` : row.phone}`}
                            target="_blank"
                            rel="noreferrer"
                            className={BUTTON.subtle}
                            title="Escribir por WhatsApp"
                          >
                            <MessageCircle size={15} />
                          </a>
                          <button
                            type="button"
                            className={BUTTON.subtle}
                            onClick={() => setDetail(row)}
                            title="Ver detalle"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            className={BUTTON.subtle}
                            onClick={() => setEditing(row)}
                            title="Editar"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            className={`${BUTTON.subtle} hover:text-racing-red`}
                            onClick={() =>
                              setConfirm({
                                ids: [row.id],
                                message: `Se eliminará el registro ${folio(row.id)} de ${row.pilot_name}. Esta acción no se puede deshacer.`,
                              })
                            }
                            title="Eliminar"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-4 py-3 text-sm text-white/50">
              <span>
                Mostrando {(current - 1) * pageSize + 1}–
                {Math.min(current * pageSize, filtered.length)} de {filtered.length}
                {filtered.length !== participants.length && ` (${participants.length} en total)`}
              </span>
              <div className="flex items-center gap-3">
                <select
                  className="border border-white/12 bg-[#0F0F0F] px-2 py-1.5 text-xs text-white/70 outline-none"
                  value={pageSize}
                  onChange={(event) => setPageSize(Number(event.target.value))}
                >
                  {PAGE_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size} por página
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className={BUTTON.subtle}
                    disabled={current === 1}
                    onClick={() => setPage(current - 1)}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="tabular-nums text-white/70">
                    {current} / {pageCount}
                  </span>
                  <button
                    type="button"
                    className={BUTTON.subtle}
                    disabled={current === pageCount}
                    onClick={() => setPage(current + 1)}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail ? detail.pilot_name : ''}
        subtitle={detail ? `${folio(detail.id)} · ${CATEGORIES[detail.category].label}` : ''}
      >
        {detail && (
          <div className="space-y-5">
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {[
                ['Vehículo', detail.vehicle_name],
                ['Copiloto', detail.copilot_name || 'Sin copiloto'],
                ['Categoría', CATEGORIES[detail.category].label],
                ...(detail.race_class
                  ? [['Clase', raceClassLabel(detail.race_class)]]
                  : []),
                ['Cuota', CATEGORIES[detail.category].feeLabel],
                ['Día', CATEGORIES[detail.category].day],
                ['Estado', detail.state || '—'],
                ['Municipio', detail.city],
                ['WhatsApp', formatPhone(detail.phone)],
                [
                  'Red social',
                  socialLink(detail.social) ? (
                    <a
                      key="social"
                      href={detail.social}
                      target="_blank"
                      rel="noreferrer"
                      className="break-all text-racing-red underline-offset-4 hover:underline"
                    >
                      {socialLabel(detail.social)}
                    </a>
                  ) : (
                    detail.social || '—'
                  ),
                ],
                ['Registrado', formatDateTime(detail.created_at)],
                ['Última edición', formatDateTime(detail.updated_at)],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs uppercase tracking-[0.15em] text-white/35">{label}</dt>
                  <dd className="mt-0.5 text-sm text-white">{value}</dd>
                </div>
              ))}
            </dl>

            {detail.notes && (
              <div className="border-l-2 border-racing-gold/60 bg-white/[0.03] p-3">
                <span className="text-xs uppercase tracking-[0.15em] text-white/35">Notas</span>
                <p className="mt-1 whitespace-pre-line text-sm text-white/75">{detail.notes}</p>
              </div>
            )}

            <div>
              <span className="text-xs uppercase tracking-[0.15em] text-white/35">Estatus</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {Object.values(STATUSES).map((status) => (
                  <Chip
                    key={status.id}
                    active={detail.status === status.id}
                    onClick={async () => {
                      const updated = await onUpdate(detail.id, { status: status.id });
                      setDetail(updated);
                    }}
                  >
                    {status.label}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
              <button
                type="button"
                className={BUTTON.danger}
                onClick={() =>
                  setConfirm({
                    ids: [detail.id],
                    message: `Se eliminará el registro ${folio(detail.id)} de ${detail.pilot_name}. Esta acción no se puede deshacer.`,
                  })
                }
              >
                <Trash2 size={16} /> Eliminar
              </button>
              <button
                type="button"
                className={BUTTON.primary}
                onClick={() => {
                  setEditing(detail);
                  setDetail(null);
                }}
              >
                <Pencil size={16} /> Editar
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ParticipantForm
        open={editing !== undefined}
        participant={editing ?? null}
        onClose={() => setEditing(undefined)}
        onSubmit={(values) => (editing ? onUpdate(editing.id, values) : onCreate(values))}
      />

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Eliminar registro"
        message={confirm?.message ?? ''}
        confirmLabel="Eliminar"
        busy={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={() => removeIds(confirm.ids)}
      />
    </div>
  );
}
