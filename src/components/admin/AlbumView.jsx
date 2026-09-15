import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  ExternalLink,
  Film,
  ImageOff,
  Images,
  Loader2,
  Play,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import { cldMediaThumb, cldPreview, cldVideoWeb, formatDuration, isVideoUrl } from '../../lib/cloudinary';
import {
  deleteAlbumPhoto,
  listAlbumAdmin,
  moderateAlbumItems,
  setAlbumItemsCategory,
} from '../../lib/api';
import {
  ALBUM_CATEGORIES,
  ALBUM_CATEGORY_IDS,
  MAX_MODERATION_BATCH,
  MODERATION_STATUSES,
} from '../../../shared/album';
import { BUTTON, ConfirmDialog, EmptyState, Modal, Panel, StatTile } from './ui';

const STATUS_FILTERS = [
  { id: 'pending', label: 'Pendientes' },
  { id: 'approved', label: 'Aprobadas' },
  { id: 'rejected', label: 'Rechazadas' },
  { id: 'unmoderated', label: 'Sin moderar' },
  { id: 'all', label: 'Todo' },
];

const TYPE_FILTERS = [
  { id: 'all', label: 'Fotos y videos' },
  { id: 'photos', label: 'Solo fotos' },
  { id: 'videos', label: 'Solo videos' },
];

const EMPTY_TITLES = {
  pending: 'No hay nada por revisar',
  approved: 'No hay archivos aprobados',
  rejected: 'No hay archivos rechazados',
  unmoderated: 'No hay archivos sin moderar',
  all: 'Aún no hay archivos',
};

const SELECT =
  'border border-white/15 bg-[#0F0F0F] px-3 py-2 text-xs text-white outline-none transition focus:border-racing-red';

const APPROVE_BUTTON =
  'inline-flex items-center justify-center gap-2 bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50';

const isVideoItem = (item) => item.resourceType === 'video' || isVideoUrl(item.url);

const toItem = (photo) => ({
  publicId: photo.id,
  resourceType: photo.resourceType,
  uploader: photo.uploader || '',
});

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

export default function AlbumView() {
  const [state, setState] = useState({ status: 'loading', photos: [], rateLimit: null, error: '' });
  const [statusFilter, setStatusFilter] = useState('pending');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [busyIds, setBusyIds] = useState(() => new Set());
  const [previewId, setPreviewId] = useState(null);
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [busyDelete, setBusyDelete] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setState((prev) => ({ ...prev, status: 'loading', error: '' }));
    try {
      const { photos, rateLimit } = await listAlbumAdmin();
      setState({ status: 'ready', photos, rateLimit, error: '' });
    } catch (err) {
      setState({ status: 'error', photos: [], rateLimit: null, error: err.message || 'Error de red' });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const out = { total: state.photos.length, videos: 0, pending: 0, approved: 0, rejected: 0, unmoderated: 0 };
    for (const photo of state.photos) {
      out[photo.status] += 1;
      if (isVideoItem(photo)) out.videos += 1;
    }
    return out;
  }, [state.photos]);

  // Categoría y tipo se cuentan dentro del estado elegido para que el select diga cuántos quedan.
  const byStatusAndType = useMemo(
    () =>
      state.photos.filter((p) => {
        if (statusFilter !== 'all' && p.status !== statusFilter) return false;
        if (typeFilter === 'photos') return !isVideoItem(p);
        if (typeFilter === 'videos') return isVideoItem(p);
        return true;
      }),
    [state.photos, statusFilter, typeFilter],
  );

  const categoryCounts = useMemo(() => {
    const out = {};
    for (const photo of byStatusAndType) out[photo.category] = (out[photo.category] || 0) + 1;
    return out;
  }, [byStatusAndType]);

  const visible = useMemo(
    () =>
      categoryFilter === 'all'
        ? byStatusAndType
        : byStatusAndType.filter((p) => p.category === categoryFilter),
    [byStatusAndType, categoryFilter],
  );

  const previewIndex = previewId ? visible.findIndex((p) => p.id === previewId) : -1;
  const previewPhoto =
    previewIndex >= 0 ? visible[previewIndex] : state.photos.find((p) => p.id === previewId) ?? null;

  const markBusy = (ids, on) =>
    setBusyIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (on) next.add(id);
        else next.delete(id);
      }
      return next;
    });

  const patchPhotos = (ids, patch) => {
    const set = new Set(ids);
    setState((prev) => ({
      ...prev,
      photos: prev.photos.map((p) => (set.has(p.id) ? { ...p, ...patch } : p)),
    }));
  };

  const reportFailures = (failures, verb) => {
    if (!failures.length) return;
    const first = failures[0].error || 'Error desconocido';
    alert(`${plural(failures.length, 'archivo no se pudo', 'archivos no se pudieron')} ${verb}.\n\n${first}`);
  };

  const moderate = async (targets, action) => {
    const ids = targets.map((p) => p.id);
    const failures = [];
    markBusy(ids, true);
    try {
      for (let i = 0; i < targets.length; i += MAX_MODERATION_BATCH) {
        const chunk = targets.slice(i, i + MAX_MODERATION_BATCH);
        const result = await moderateAlbumItems(chunk.map(toItem), action);
        patchPhotos(result.done ?? [], { status: result.status });
        failures.push(...(result.failed ?? []));
      }
    } catch (err) {
      failures.push({ error: err.message });
    } finally {
      markBusy(ids, false);
    }
    reportFailures(failures, action === 'approve' ? 'aprobar' : 'rechazar');
  };

  const changeCategory = async (photo, category) => {
    if (category === photo.category) return;
    markBusy([photo.id], true);
    try {
      const result = await setAlbumItemsCategory([toItem(photo)], category);
      patchPhotos(result.done ?? [], { category });
      reportFailures(result.failed ?? [], 'cambiar de sección');
    } catch (err) {
      reportFailures([{ error: err.message }], 'cambiar de sección');
    } finally {
      markBusy([photo.id], false);
    }
  };

  /** Desde la vista previa: modera y pasa al siguiente de la lista filtrada. */
  const moderateFromPreview = async (photo, action) => {
    const idx = visible.findIndex((p) => p.id === photo.id);
    const nextPhoto = visible[idx + 1] ?? visible[idx - 1] ?? null;
    await moderate([photo], action);
    setPreviewId(nextPhoto?.id ?? null);
  };

  const doBulkApprove = async () => {
    const targets = visible.filter((p) => p.status === 'pending');
    setConfirmBulk(false);
    await moderate(targets, 'approve');
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    setBusyDelete(true);
    try {
      await deleteAlbumPhoto(confirmDelete.id, confirmDelete.resourceType);
      setState((prev) => ({
        ...prev,
        photos: prev.photos.filter((p) => p.id !== confirmDelete.id),
      }));
      setConfirmDelete(null);
    } catch (err) {
      alert(err.message || 'No se pudo eliminar el archivo.');
    } finally {
      setBusyDelete(false);
    }
  };

  const pendingVisible = visible.filter((p) => p.status === 'pending').length;
  const rateLimit = state.rateLimit;
  const bulkBusy = visible.some((p) => busyIds.has(p.id));

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Por revisar"
          value={stats.pending}
          hero
          hint={`${plural(stats.total, 'archivo', 'archivos')} · ${plural(stats.videos, 'video', 'videos')}`}
        />
        <StatTile label="Aprobadas (públicas)" value={stats.approved} accent="#22C55E" />
        <StatTile label="Rechazadas" value={stats.rejected} accent="#FF2A2A" />
        <StatTile
          label="API Cloudinary"
          value={rateLimit ? rateLimit.remaining : '—'}
          accent={rateLimit && rateLimit.remaining < 60 ? '#FF2A2A' : '#8B5CF6'}
          hint={rateLimit ? `de ${rateLimit.limit} llamadas por hora` : 'Sin dato de cuota'}
        />
      </div>

      {stats.unmoderated > 0 && (
        <div className="flex items-start gap-3 border border-amber-400/40 bg-amber-400/10 p-4 text-sm text-white/80">
          <ShieldAlert size={18} className="mt-0.5 shrink-0 text-amber-300" />
          <div className="min-w-0">
            <p className="font-semibold text-white">
              {plural(stats.unmoderated, 'archivo se subió', 'archivos se subieron')} sin moderación
            </p>
            <p className="mt-1 text-white/60">
              No se publican y no se pueden aprobar. Activa <b className="text-white">Moderation: Manual</b>{' '}
              en el upload preset <code className="text-white">carfest_album</code> (Cloudinary → Settings →
              Upload → Upload presets) para que todo lo nuevo llegue a Pendientes. Los que ya están sin
              moderar solo se pueden borrar.
            </p>
          </div>
        </div>
      )}

      <Panel
        title="Álbum del evento"
        subtitle="Nada se publica solo: lo que subió la gente queda pendiente hasta que lo apruebes. Rechazar lo quita del sitio sin borrarlo."
        action={
          <button
            type="button"
            onClick={() => load(true)}
            className={BUTTON.ghost}
            disabled={state.status === 'loading'}
            title="Actualizar"
          >
            <RefreshCw size={14} className={state.status === 'loading' ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        }
      >
        <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.filter((f) => f.id !== 'unmoderated' || stats.unmoderated > 0).map((f) => {
              const count = f.id === 'all' ? stats.total : stats[f.id];
              const active = statusFilter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStatusFilter(f.id)}
                  className={`inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs uppercase tracking-[0.12em] transition ${
                    active
                      ? 'border-white/40 bg-white/10 text-white'
                      : 'border-white/10 text-white/50 hover:text-white'
                  }`}
                >
                  {MODERATION_STATUSES[f.id] && (
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: MODERATION_STATUSES[f.id].color }}
                    />
                  )}
                  {f.label}
                  <span className="text-white/40">{count}</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={SELECT}
              aria-label="Filtrar por sección"
            >
              <option value="all">Todas las secciones ({byStatusAndType.length})</option>
              {ALBUM_CATEGORY_IDS.map((id) => (
                <option key={id} value={id}>
                  {ALBUM_CATEGORIES[id].label} ({categoryCounts[id] || 0})
                </option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className={SELECT}
              aria-label="Filtrar por tipo"
            >
              {TYPE_FILTERS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
            {pendingVisible > 0 && (
              <button
                type="button"
                onClick={() => setConfirmBulk(true)}
                disabled={bulkBusy}
                className={`${APPROVE_BUTTON} col-span-2 py-2 text-xs`}
              >
                {bulkBusy ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                Aprobar {plural(pendingVisible, 'pendiente', 'pendientes')}
              </button>
            )}
          </div>
        </div>

        {state.status === 'loading' && (
          <div className="flex items-center justify-center py-16 text-white/50">
            <Loader2 size={20} className="mr-2 animate-spin text-racing-red" />
            Cargando fotos…
          </div>
        )}

        {state.status === 'error' && (
          <div className="flex items-start gap-3 border border-racing-red/40 bg-racing-red/10 p-4 text-sm text-white/80">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-racing-red" />
            <div className="min-w-0">
              <p className="font-semibold text-white">No pudimos cargar el álbum</p>
              <p className="mt-1 break-words text-white/60">{state.error}</p>
              <button type="button" onClick={() => load()} className={`${BUTTON.ghost} mt-3`}>
                <RefreshCw size={14} /> Reintentar
              </button>
            </div>
          </div>
        )}

        {state.status === 'ready' && visible.length === 0 && (
          <EmptyState
            icon={statusFilter === 'pending' ? ShieldCheck : statusFilter === 'rejected' ? ImageOff : Images}
            title={EMPTY_TITLES[statusFilter]}
            message={
              stats.total === 0
                ? 'Cuando los asistentes suban fotos o videos por el QR aparecerán aquí.'
                : 'Cambia el filtro para ver otros archivos.'
            }
          />
        )}

        {state.status === 'ready' && visible.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {visible.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                busy={busyIds.has(photo.id)}
                onPreview={() => setPreviewId(photo.id)}
                onApprove={() => moderate([photo], 'approve')}
                onReject={() => moderate([photo], 'reject')}
                onCategory={(category) => changeCategory(photo, category)}
                onDelete={() => setConfirmDelete(photo)}
              />
            ))}
          </div>
        )}
      </Panel>

      <Modal
        open={Boolean(previewPhoto)}
        onClose={() => setPreviewId(null)}
        title="Revisar archivo"
        subtitle={
          previewPhoto
            ? [
                previewIndex >= 0 ? `${previewIndex + 1} de ${visible.length}` : null,
                previewPhoto.uploader ? `@${previewPhoto.uploader}` : 'Anónimo',
                formatCreated(previewPhoto.createdAt),
              ]
                .filter(Boolean)
                .join(' · ')
            : ''
        }
        wide
      >
        {previewPhoto && (
          <PreviewBody
            photo={previewPhoto}
            busy={busyIds.has(previewPhoto.id)}
            onApprove={() => moderateFromPreview(previewPhoto, 'approve')}
            onReject={() => moderateFromPreview(previewPhoto, 'reject')}
            onCategory={(category) => changeCategory(previewPhoto, category)}
            onDelete={() => {
              setPreviewId(null);
              setConfirmDelete(previewPhoto);
            }}
          />
        )}
      </Modal>

      <Modal open={confirmBulk} onClose={() => setConfirmBulk(false)} title="Aprobar pendientes">
        <div className="flex gap-3">
          <ShieldCheck size={22} className="mt-0.5 shrink-0 text-emerald-400" />
          <p className="text-sm text-white/70">
            Vas a publicar {plural(pendingVisible, 'archivo', 'archivos')} en el álbum público
            {categoryFilter !== 'all' ? ` (sección ${ALBUM_CATEGORIES[categoryFilter].label})` : ''}.
            Revisa que todos cumplan las reglas antes de continuar.
          </p>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={() => setConfirmBulk(false)} className={BUTTON.ghost}>
            Cancelar
          </button>
          <button type="button" onClick={doBulkApprove} className={APPROVE_BUTTON}>
            Aprobar {pendingVisible}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title={confirmDelete && isVideoItem(confirmDelete) ? 'Eliminar video' : 'Eliminar foto'}
        message={
          confirmDelete && isVideoItem(confirmDelete)
            ? 'Esta acción borra el video de Cloudinary de forma permanente. Si solo quieres quitarlo del sitio, usa Rechazar.'
            : 'Esta acción borra la foto de Cloudinary de forma permanente. Si solo quieres quitarla del sitio, usa Rechazar.'
        }
        confirmLabel="Eliminar definitivamente"
        onConfirm={doDelete}
        onCancel={() => (busyDelete ? null : setConfirmDelete(null))}
        busy={busyDelete}
      />
    </div>
  );
}

function formatCreated(value) {
  if (!value) return '';
  return new Date(value).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusBadge({ status }) {
  const meta = MODERATION_STATUSES[status];
  return (
    <span
      className="inline-flex items-center gap-1 border bg-black/70 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-white"
      style={{ borderColor: `${meta.color}99` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
      {meta.label}
    </span>
  );
}

function CategorySelect({ value, onChange, disabled, className = '' }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      aria-label="Sección"
      className={`${SELECT} disabled:opacity-50 ${className}`}
    >
      {ALBUM_CATEGORY_IDS.map((id) => (
        <option key={id} value={id}>
          {ALBUM_CATEGORIES[id].label}
        </option>
      ))}
    </select>
  );
}

function ModerationButtons({ photo, busy, onApprove, onReject, onDelete, size = 'card' }) {
  const canModerate = photo.status !== 'unmoderated';
  const base =
    size === 'card'
      ? 'flex flex-1 items-center justify-center gap-1.5 px-2 py-2 text-[11px] font-semibold transition disabled:opacity-40'
      : 'inline-flex items-center justify-center gap-2 border px-4 py-2.5 text-sm font-semibold transition disabled:opacity-40';
  // En tarjeta los botones comparten fila con divisor neutro; en el modal cada uno lleva su borde de color.
  const border = (color) => (size === 'card' ? 'border-r border-white/10' : color);
  const icon = size === 'card' ? 'hidden sm:block' : '';

  return (
    <>
      {canModerate && photo.status !== 'approved' && (
        <button
          type="button"
          onClick={onApprove}
          disabled={busy}
          className={`${base} ${border('border-emerald-500/50')} text-emerald-300 hover:bg-emerald-500/15 hover:text-white`}
          title="Publicar en el álbum"
        >
          {busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} className={icon} />}
          Aprobar
        </button>
      )}
      {canModerate && photo.status !== 'rejected' && (
        <button
          type="button"
          onClick={onReject}
          disabled={busy}
          className={`${base} ${border('border-amber-400/50')} text-amber-200 hover:bg-amber-400/15 hover:text-white`}
          title="Quitar del álbum sin borrar"
        >
          <X size={13} className={icon} />
          Rechazar
        </button>
      )}
      <button
        type="button"
        onClick={onDelete}
        disabled={busy}
        className={
          size === 'card'
            ? 'flex w-10 shrink-0 items-center justify-center text-racing-red/80 transition hover:bg-racing-red/15 hover:text-white disabled:opacity-40'
            : `${base} border-racing-red/60 text-racing-red hover:bg-racing-red/15 hover:text-white`
        }
        title="Eliminar definitivamente"
        aria-label="Eliminar definitivamente"
      >
        <Trash2 size={13} />
        {size !== 'card' && 'Borrar'}
      </button>
    </>
  );
}

function PhotoCard({ photo, busy, onPreview, onApprove, onReject, onCategory, onDelete }) {
  const isVideo = isVideoItem(photo);
  const dimmed = photo.status === 'rejected' || photo.status === 'unmoderated';

  return (
    <div className="group relative flex flex-col overflow-hidden border border-white/10 bg-[#0F0F0F]">
      <button
        type="button"
        onClick={onPreview}
        className="relative block aspect-square overflow-hidden bg-black/40"
        title="Ver en grande"
      >
        <img
          src={cldMediaThumb(photo.url)}
          alt={isVideo ? 'Video del álbum' : 'Foto del álbum'}
          loading="lazy"
          className={`h-full w-full object-cover transition ${dimmed ? 'opacity-40 grayscale' : ''}`}
        />
        <span className="absolute left-2 top-2">
          <StatusBadge status={photo.status} />
        </span>
        {isVideo && (
          <>
            <span className="absolute right-2 top-2 inline-flex items-center gap-1 border border-violet-300/50 bg-violet-500/25 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.18em] text-violet-100">
              <Film size={10} />
            </span>
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/15">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-black shadow-md">
                <Play size={16} className="translate-x-[1px]" />
              </span>
            </span>
            {photo.duration ? (
              <span className="absolute bottom-2 right-2 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-medium text-white">
                {formatDuration(photo.duration)}
              </span>
            ) : null}
          </>
        )}
      </button>

      <div className="flex flex-col gap-1.5 px-2.5 py-2 text-[11px] text-white/50">
        <span className="truncate uppercase tracking-[0.14em] text-white/70">
          {photo.uploader ? `@${photo.uploader}` : 'Anónimo'}
        </span>
        <span className="truncate">{formatCreated(photo.createdAt)}</span>
        <CategorySelect
          value={photo.category}
          onChange={onCategory}
          disabled={busy}
          className="w-full px-2 py-1.5 text-[11px]"
        />
      </div>

      <div className="flex border-t border-white/10">
        <ModerationButtons
          photo={photo}
          busy={busy}
          onApprove={onApprove}
          onReject={onReject}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}

function PreviewBody({ photo, busy, onApprove, onReject, onCategory, onDelete }) {
  return (
    <div>
      <div className="flex justify-center bg-black">
        {isVideoItem(photo) ? (
          <video
            key={photo.id}
            src={cldVideoWeb(photo.url)}
            poster={cldMediaThumb(photo.url)}
            controls
            playsInline
            preload="metadata"
            className="max-h-[60vh] w-auto max-w-full object-contain"
          />
        ) : (
          <img
            key={photo.id}
            src={cldPreview(photo.url)}
            alt="Archivo en revisión"
            className="max-h-[60vh] w-auto max-w-full object-contain"
          />
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <StatusBadge status={photo.status} />
          <a
            href={photo.url}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 text-xs text-white/50 transition hover:text-white"
          >
            <ExternalLink size={12} /> Original
          </a>
        </div>
        <CategorySelect value={photo.category} onChange={onCategory} disabled={busy} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:justify-end">
        <ModerationButtons
          photo={photo}
          busy={busy}
          onApprove={onApprove}
          onReject={onReject}
          onDelete={onDelete}
          size="modal"
        />
      </div>
    </div>
  );
}
