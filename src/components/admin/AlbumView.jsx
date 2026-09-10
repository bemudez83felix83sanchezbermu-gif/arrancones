import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ExternalLink,
  Eye,
  EyeOff,
  Film,
  ImageOff,
  Images,
  Loader2,
  Play,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { cldMediaThumb, formatDuration, isVideoUrl } from '../../lib/cloudinary';
import {
  deleteAlbumPhoto,
  listAlbumAdmin,
  setAlbumPhotoHidden,
} from '../../lib/api';
import { BUTTON, ConfirmDialog, EmptyState, Panel, StatTile } from './ui';

const FILTERS = [
  { id: 'all', label: 'Todo' },
  { id: 'photos', label: 'Fotos' },
  { id: 'videos', label: 'Videos' },
  { id: 'visible', label: 'Visibles' },
  { id: 'hidden', label: 'Ocultas' },
];

const isVideoItem = (item) => item.resourceType === 'video' || isVideoUrl(item.url);

export default function AlbumView() {
  const [state, setState] = useState({ status: 'loading', photos: [], error: '' });
  const [filter, setFilter] = useState('all');
  const [pendingId, setPendingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [busyDelete, setBusyDelete] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setState((prev) => ({ ...prev, status: 'loading', error: '' }));
    try {
      const photos = await listAlbumAdmin();
      setState({ status: 'ready', photos, error: '' });
    } catch (err) {
      setState({ status: 'error', photos: [], error: err.message || 'Error de red' });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const total = state.photos.length;
    const hidden = state.photos.filter((p) => p.hidden).length;
    const videos = state.photos.filter(isVideoItem).length;
    return { total, hidden, visible: total - hidden, videos, photos: total - videos };
  }, [state.photos]);

  const visible = useMemo(() => {
    switch (filter) {
      case 'visible':
        return state.photos.filter((p) => !p.hidden);
      case 'hidden':
        return state.photos.filter((p) => p.hidden);
      case 'photos':
        return state.photos.filter((p) => !isVideoItem(p));
      case 'videos':
        return state.photos.filter(isVideoItem);
      default:
        return state.photos;
    }
  }, [state.photos, filter]);

  const toggleHidden = async (photo) => {
    setPendingId(photo.id);
    try {
      await setAlbumPhotoHidden(photo.id, !photo.hidden, photo.resourceType);
      setState((prev) => ({
        ...prev,
        photos: prev.photos.map((p) => (p.id === photo.id ? { ...p, hidden: !p.hidden } : p)),
      }));
    } catch (err) {
      alert(err.message || 'No se pudo actualizar el archivo.');
    } finally {
      setPendingId(null);
    }
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

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Archivos totales"
          value={stats.total}
          hero
          hint={`${stats.photos} foto${stats.photos === 1 ? '' : 's'} · ${stats.videos} video${stats.videos === 1 ? '' : 's'}`}
        />
        <StatTile label="Visibles" value={stats.visible} accent="#22C55E" />
        <StatTile label="Ocultas" value={stats.hidden} accent="#C2891A" />
        <StatTile label="Videos" value={stats.videos} accent="#8B5CF6" />
      </div>

      <Panel
        title="Álbum del evento"
        subtitle="Ocultar quita el archivo del sitio público sin borrarlo. Eliminar lo borra de Cloudinary."
        action={
          <div className="flex items-center gap-2">
            <div className="flex overflow-hidden border border-white/15">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={`px-3 py-1.5 text-xs uppercase tracking-[0.15em] transition ${
                    filter === f.id
                      ? 'bg-white/10 text-white'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
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
          </div>
        }
      >
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
              <button
                type="button"
                onClick={() => load()}
                className={`${BUTTON.ghost} mt-3`}
              >
                <RefreshCw size={14} /> Reintentar
              </button>
            </div>
          </div>
        )}

        {state.status === 'ready' && visible.length === 0 && (
          <EmptyState
            icon={filter === 'hidden' ? ImageOff : filter === 'videos' ? Film : Images}
            title={
              filter === 'hidden'
                ? 'No hay archivos ocultos'
                : filter === 'visible'
                ? 'No hay archivos visibles'
                : filter === 'videos'
                ? 'Todavía no hay videos'
                : filter === 'photos'
                ? 'Todavía no hay fotos'
                : 'Aún no hay archivos'
            }
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
                busy={pendingId === photo.id}
                onToggle={() => toggleHidden(photo)}
                onDelete={() => setConfirmDelete(photo)}
              />
            ))}
          </div>
        )}
      </Panel>

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title={confirmDelete && isVideoItem(confirmDelete) ? 'Eliminar video' : 'Eliminar foto'}
        message={
          confirmDelete && isVideoItem(confirmDelete)
            ? 'Esta acción borra el video de Cloudinary de forma permanente. Si solo quieres quitarlo del sitio, usa Ocultar.'
            : 'Esta acción borra la foto de Cloudinary de forma permanente. Si solo quieres quitarla del sitio, usa Ocultar.'
        }
        confirmLabel="Eliminar definitivamente"
        onConfirm={doDelete}
        onCancel={() => (busyDelete ? null : setConfirmDelete(null))}
        busy={busyDelete}
      />
    </div>
  );
}

function PhotoCard({ photo, busy, onToggle, onDelete }) {
  const isVideo = isVideoItem(photo);
  const created = photo.createdAt
    ? new Date(photo.createdAt).toLocaleString('es-MX', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div className="group relative flex flex-col overflow-hidden border border-white/10 bg-[#0F0F0F]">
      <div className="relative aspect-square overflow-hidden bg-black/40">
        <img
          src={cldMediaThumb(photo.url)}
          alt={isVideo ? 'Video del álbum' : 'Foto del álbum'}
          loading="lazy"
          className={`h-full w-full object-cover transition ${photo.hidden ? 'opacity-40 grayscale' : ''}`}
        />
        <span
          className={`absolute left-2 top-2 border px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] ${
            photo.hidden
              ? 'border-amber-400/50 bg-amber-400/15 text-amber-200'
              : 'border-emerald-400/50 bg-emerald-400/10 text-emerald-200'
          }`}
        >
          {photo.hidden ? 'Oculta' : 'Visible'}
        </span>
        {isVideo && (
          <>
            <span className="absolute right-2 top-2 inline-flex items-center gap-1 border border-violet-300/50 bg-violet-500/25 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-violet-100">
              <Film size={10} /> Video
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
      </div>

      <div className="flex flex-col gap-1 px-3 py-2 text-[11px] text-white/50">
        <span className="truncate uppercase tracking-[0.14em] text-white/70">
          {photo.uploader ? `@${photo.uploader}` : 'Anónimo'}
        </span>
        <span className="truncate">{created}</span>
      </div>

      <div className="flex border-t border-white/10">
        <button
          type="button"
          onClick={onToggle}
          disabled={busy}
          className="flex flex-1 items-center justify-center gap-1.5 border-r border-white/10 px-2 py-2 text-[11px] font-medium text-white/60 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
          title={photo.hidden ? 'Mostrar en el álbum' : 'Ocultar del álbum'}
        >
          {photo.hidden ? <Eye size={13} /> : <EyeOff size={13} />}
          <span className="hidden sm:inline">{photo.hidden ? 'Mostrar' : 'Ocultar'}</span>
        </button>
        <a
          href={photo.url}
          target="_blank"
          rel="noreferrer noopener"
          className="flex flex-1 items-center justify-center gap-1.5 border-r border-white/10 px-2 py-2 text-[11px] font-medium text-white/60 transition hover:bg-white/5 hover:text-white"
          title="Ver original en Cloudinary"
        >
          <ExternalLink size={13} />
          <span className="hidden sm:inline">Ver</span>
        </a>
        <button
          type="button"
          onClick={onDelete}
          className="flex flex-1 items-center justify-center gap-1.5 px-2 py-2 text-[11px] font-medium text-racing-red/80 transition hover:bg-racing-red/15 hover:text-white"
          title="Eliminar definitivamente"
        >
          <Trash2 size={13} />
          <span className="hidden sm:inline">Borrar</span>
        </button>
      </div>
    </div>
  );
}
