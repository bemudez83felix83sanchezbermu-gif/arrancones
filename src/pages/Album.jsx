import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Images,
  Loader2,
  Play,
  RefreshCw,
  X,
} from 'lucide-react';
import { Link } from '../router';
import {
  cldMediaThumb,
  cldPreview,
  cldVideoWeb,
  formatDuration,
  isVideoUrl,
} from '../lib/cloudinary';

export default function Album() {
  const [state, setState] = useState({ status: 'loading', photos: [], error: '' });
  const [openIndex, setOpenIndex] = useState(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    setState((prev) => ({ ...prev, status: 'loading', error: '' }));
    fetch('/api/album/public', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'HTTP');
        return res.json();
      })
      .then((data) => {
        if (!alive) return;
        setState({ status: 'ready', photos: data.photos || [], error: '' });
      })
      .catch((err) => {
        if (!alive) return;
        setState({
          status: 'error',
          photos: [],
          error: err.message || 'No pudimos cargar el álbum.',
        });
      });
    return () => {
      alive = false;
    };
  }, [tick]);

  const openLightbox = useCallback((index) => setOpenIndex(index), []);
  const closeLightbox = useCallback(() => setOpenIndex(null), []);

  const photos = state.photos;
  const currentPhoto = openIndex != null ? photos[openIndex] : null;

  const prev = useCallback(() => {
    setOpenIndex((idx) => (idx == null || photos.length === 0 ? idx : (idx - 1 + photos.length) % photos.length));
  }, [photos.length]);
  const next = useCallback(() => {
    setOpenIndex((idx) => (idx == null || photos.length === 0 ? idx : (idx + 1) % photos.length));
  }, [photos.length]);

  useEffect(() => {
    if (openIndex == null) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [openIndex, closeLightbox, prev, next]);

  const counter = useMemo(() => {
    if (state.status !== 'ready') return '';
    if (!photos.length) return '';
    const videos = photos.filter((p) => p.resourceType === 'video' || isVideoUrl(p.url)).length;
    const pics = photos.length - videos;
    const parts = [];
    if (pics) parts.push(`${pics} foto${pics === 1 ? '' : 's'}`);
    if (videos) parts.push(`${videos} video${videos === 1 ? '' : 's'}`);
    return parts.join(' · ');
  }, [state.status, photos]);

  return (
    <div className="min-h-screen bg-racing-asphalt text-white">
      <Backdrop />

      <header className="relative z-10 border-b border-white/10 bg-racing-asphalt/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 md:px-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-white/60 transition hover:text-white"
          >
            <ArrowLeft size={14} /> Inicio
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTick((n) => n + 1)}
              className="inline-flex items-center gap-1.5 border border-white/15 px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-white/60 transition hover:border-white/40 hover:text-white"
              aria-label="Actualizar"
            >
              <RefreshCw size={12} /> Actualizar
            </button>
            <Link
              to="/album/subir"
              className="inline-flex items-center gap-1.5 bg-racing-red px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-racing-red/85"
            >
              <ImagePlus size={12} /> Subir
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-14">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-racing-red">
              Álbum del evento
            </span>
            <h1 className="display mt-3 text-4xl leading-tight md:text-6xl">Car Fest 2K26</h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/60 md:text-base">
              Fotos y videos que la comunidad subió durante el evento. Toca cualquier miniatura
              para verla en grande.
            </p>
          </div>
          {counter && <span className="text-xs uppercase tracking-[0.25em] text-white/50">{counter}</span>}
        </div>

        {state.status === 'loading' && (
          <div className="flex items-center justify-center py-24 text-white/50">
            <Loader2 size={22} className="mr-2 animate-spin text-racing-red" /> Cargando fotos…
          </div>
        )}

        {state.status === 'error' && (
          <div className="border border-racing-red/40 bg-racing-red/10 p-6 text-sm text-white/80">
            <p className="font-semibold text-white">No pudimos cargar el álbum</p>
            <p className="mt-1 text-white/70">{state.error}</p>
            <button
              type="button"
              onClick={() => setTick((n) => n + 1)}
              className="mt-4 inline-flex items-center gap-2 border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white transition hover:border-white"
            >
              <RefreshCw size={12} /> Reintentar
            </button>
          </div>
        )}

        {state.status === 'ready' && photos.length === 0 && (
          <div className="flex flex-col items-center border border-dashed border-white/15 bg-white/[0.03] px-6 py-16 text-center">
            <Images size={30} className="text-white/40" />
            <p className="mt-4 text-lg font-semibold text-white">Aún no hay fotos ni videos</p>
            <p className="mt-2 max-w-sm text-sm text-white/50">
              Sé el primero en compartir cómo se vivió el Car Fest 2K26.
            </p>
            <Link
              to="/album/subir"
              className="mt-6 inline-flex items-center gap-2 bg-racing-red px-5 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-white transition hover:bg-racing-red/85"
            >
              <ImagePlus size={14} /> Subir fotos o videos
            </Link>
          </div>
        )}

        {state.status === 'ready' && photos.length > 0 && (
          <div className="columns-2 gap-3 md:columns-3 lg:columns-4">
            {photos.map((photo, index) => {
              const isVideo = photo.resourceType === 'video' || isVideoUrl(photo.url);
              return (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => openLightbox(index)}
                  className="group relative mb-3 block w-full break-inside-avoid overflow-hidden border border-white/10 bg-black/40 transition hover:border-white/30"
                >
                  <img
                    src={cldMediaThumb(photo.url)}
                    alt={isVideo ? 'Video del Car Fest' : 'Foto del Car Fest'}
                    loading="lazy"
                    className="block h-auto w-full transition duration-500 group-hover:scale-[1.02]"
                    style={{
                      aspectRatio:
                        photo.width && photo.height ? `${photo.width} / ${photo.height}` : undefined,
                    }}
                  />
                  {isVideo && (
                    <>
                      <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20 transition group-hover:bg-black/10">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-black shadow-lg transition group-hover:scale-110">
                          <Play size={20} className="translate-x-[2px]" />
                        </span>
                      </span>
                      {photo.duration ? (
                        <span className="absolute bottom-2 right-2 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-medium text-white">
                          {formatDuration(photo.duration)}
                        </span>
                      ) : null}
                    </>
                  )}
                  {photo.uploader && (
                    <span className="block bg-black/70 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-white/60">
                      @{photo.uploader}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </main>

      <AnimatePresence>
        {currentPhoto && (
          <Lightbox
            photo={currentPhoto}
            onClose={closeLightbox}
            onPrev={prev}
            onNext={next}
            index={openIndex}
            total={photos.length}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function Lightbox({ photo, onClose, onPrev, onNext, index, total }) {
  return (
    <motion.div
      key="lb"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 px-4 py-8"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center border border-white/20 bg-black/50 text-white transition hover:border-white"
        aria-label="Cerrar"
      >
        <X size={18} />
      </button>

      {total > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            className="absolute left-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-white/20 bg-black/50 text-white transition hover:border-white md:left-6"
            aria-label="Anterior"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="absolute right-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-white/20 bg-black/50 text-white transition hover:border-white md:right-6"
            aria-label="Siguiente"
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}

      <motion.div
        key={photo.id}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="relative flex max-h-full max-w-5xl flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {photo.resourceType === 'video' || isVideoUrl(photo.url) ? (
          <video
            key={photo.id}
            src={cldVideoWeb(photo.url)}
            poster={cldMediaThumb(photo.url)}
            controls
            autoPlay
            playsInline
            preload="metadata"
            className="max-h-[80vh] w-auto max-w-full bg-black object-contain"
          />
        ) : (
          <img
            src={cldPreview(photo.url)}
            alt="Foto del Car Fest"
            className="max-h-[80vh] w-auto max-w-full object-contain"
          />
        )}
        <div className="mt-3 flex w-full items-center justify-between gap-3 text-xs text-white/60">
          <span>{total > 1 ? `${index + 1} / ${total}` : ''}</span>
          {photo.uploader ? (
            <span className="uppercase tracking-[0.2em] text-white/50">@{photo.uploader}</span>
          ) : (
            <span />
          )}
          <a
            href={photo.url}
            target="_blank"
            rel="noreferrer noopener"
            className="uppercase tracking-[0.2em] text-white/60 transition hover:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            Ver original ↗
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Backdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-40 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-racing-red/12 blur-[140px]" />
      <div className="absolute bottom-0 left-[-140px] h-[420px] w-[420px] rounded-full bg-racing-red/6 blur-[160px]" />
    </div>
  );
}
