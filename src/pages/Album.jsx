import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  ShieldCheck,
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
import { ALBUM_CATEGORIES, ALBUM_CATEGORY_IDS } from '../../shared/album';

const ALL = 'all';

const readCategoryParam = () => {
  const value = new URLSearchParams(window.location.search).get('cat');
  return value && ALBUM_CATEGORIES[value] ? value : ALL;
};

const isVideoItem = (item) => item.resourceType === 'video' || isVideoUrl(item.url);

export default function Album() {
  const [state, setState] = useState({ status: 'loading', photos: [], error: '' });
  const [category, setCategory] = useState(readCategoryParam);
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

  const selectCategory = useCallback((id) => {
    setCategory(id);
    setOpenIndex(null);
    window.history.replaceState({}, '', id === ALL ? '/album' : `/album?cat=${id}`);
  }, []);

  const counts = useMemo(() => {
    const out = { [ALL]: state.photos.length };
    for (const id of ALBUM_CATEGORY_IDS) out[id] = 0;
    for (const photo of state.photos) out[photo.category] = (out[photo.category] || 0) + 1;
    return out;
  }, [state.photos]);

  const photos = useMemo(
    () => (category === ALL ? state.photos : state.photos.filter((p) => p.category === category)),
    [state.photos, category],
  );

  const openLightbox = useCallback((index) => setOpenIndex(index), []);
  const closeLightbox = useCallback(() => setOpenIndex(null), []);

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
    const videos = photos.filter(isVideoItem).length;
    const pics = photos.length - videos;
    const parts = [];
    if (pics) parts.push(`${pics} foto${pics === 1 ? '' : 's'}`);
    if (videos) parts.push(`${videos} video${videos === 1 ? '' : 's'}`);
    return parts.join(' · ');
  }, [state.status, photos]);

  const activeCategory = ALBUM_CATEGORIES[category];
  const uploadHref = activeCategory ? `/album/subir?cat=${category}` : '/album/subir';

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
              to={uploadHref}
              className="inline-flex items-center gap-1.5 bg-racing-red px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-racing-red/85"
            >
              <ImagePlus size={12} /> Subir
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-14">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-racing-red">
              Álbum del evento
            </span>
            <h1 className="display mt-3 text-4xl leading-tight md:text-6xl">Car Fest 2K26</h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/60 md:text-base">
              Fotos y videos que la comunidad subió, separados por sección. Toca cualquier
              miniatura para verla en grande.
            </p>
            <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-white/40">
              <ShieldCheck size={12} className="text-emerald-400/80" /> Cada archivo lo revisa el
              equipo antes de publicarse.
            </p>
          </div>
          {counter && <span className="text-xs uppercase tracking-[0.25em] text-white/50">{counter}</span>}
        </div>

        <nav
          aria-label="Secciones del álbum"
          className="-mx-4 mb-8 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden"
        >
          <div className="flex w-max gap-2 md:w-auto md:flex-wrap">
            <CategoryTab
              label="Todo"
              count={counts[ALL]}
              active={category === ALL}
              onClick={() => selectCategory(ALL)}
            />
            {ALBUM_CATEGORY_IDS.map((id) => (
              <CategoryTab
                key={id}
                label={ALBUM_CATEGORIES[id].label}
                color={ALBUM_CATEGORIES[id].color}
                count={counts[id]}
                active={category === id}
                onClick={() => selectCategory(id)}
              />
            ))}
          </div>
        </nav>

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
            <p className="mt-4 text-lg font-semibold text-white">
              {activeCategory
                ? `Aún no hay fotos de ${activeCategory.label.toLowerCase()}`
                : 'Aún no hay fotos ni videos'}
            </p>
            <p className="mt-2 max-w-sm text-sm text-white/50">
              {activeCategory
                ? activeCategory.hint + '. Sé el primero en compartirlo.'
                : 'Sé el primero en compartir cómo se vivió el Car Fest 2K26.'}
            </p>
            <Link
              to={uploadHref}
              className="mt-6 inline-flex items-center gap-2 bg-racing-red px-5 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-white transition hover:bg-racing-red/85"
            >
              <ImagePlus size={14} /> Subir fotos o videos
            </Link>
          </div>
        )}

        {state.status === 'ready' && photos.length > 0 && (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="columns-2 gap-3 md:columns-3 lg:columns-4"
          >
            {photos.map((photo, index) => {
              const isVideo = isVideoItem(photo);
              const cat = ALBUM_CATEGORIES[photo.category];
              return (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => openLightbox(index)}
                  className="group relative mb-3 block w-full break-inside-avoid overflow-hidden border border-white/10 bg-black/40 transition hover:border-white/30"
                >
                  <img
                    src={cldMediaThumb(photo.url)}
                    alt={`${isVideo ? 'Video' : 'Foto'} de ${cat?.label ?? 'Car Fest'}`}
                    loading="lazy"
                    className="block h-auto w-full transition duration-500 group-hover:scale-[1.02]"
                    style={{
                      aspectRatio:
                        photo.width && photo.height ? `${photo.width} / ${photo.height}` : undefined,
                    }}
                  />
                  {category === ALL && cat && (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 bg-black/75 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/85">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      {cat.short}
                    </span>
                  )}
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
                    <span className="block truncate bg-black/70 px-2 py-1 text-left text-[10px] uppercase tracking-[0.18em] text-white/60">
                      @{photo.uploader}
                    </span>
                  )}
                </button>
              );
            })}
          </motion.div>
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

function CategoryTab({ label, count, color, active, onClick }) {
  const ref = useRef(null);

  // En móvil la fila se desplaza horizontalmente: la pestaña activa (o la de ?cat=) queda a la vista.
  useEffect(() => {
    if (active) ref.current?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }, [active]);

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex shrink-0 items-center gap-2 border px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
        active ? 'text-white' : 'border-white/15 text-white/55 hover:border-white/35 hover:text-white'
      }`}
      style={
        active
          ? { borderColor: color ?? '#FFFFFF', backgroundColor: `${color ?? '#FFFFFF'}24` }
          : undefined
      }
    >
      {color && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />}
      {label}
      <span className={active ? 'text-white/70' : 'text-white/35'}>{count}</span>
    </button>
  );
}

function Lightbox({ photo, onClose, onPrev, onNext, index, total }) {
  const cat = ALBUM_CATEGORIES[photo.category];
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
        {isVideoItem(photo) ? (
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
            alt={`Foto de ${cat?.label ?? 'Car Fest'}`}
            className="max-h-[80vh] w-auto max-w-full object-contain"
          />
        )}
        <div className="mt-3 flex w-full items-center justify-between gap-3 text-xs text-white/60">
          <span className="inline-flex min-w-0 items-center gap-1.5">
            {total > 1 ? `${index + 1} / ${total}` : ''}
            {cat && (
              <span className="inline-flex items-center gap-1 truncate uppercase tracking-[0.18em] text-white/50">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: cat.color }} />
                {cat.short}
              </span>
            )}
          </span>
          {photo.uploader ? (
            <span className="truncate uppercase tracking-[0.2em] text-white/50">@{photo.uploader}</span>
          ) : (
            <span />
          )}
          <a
            href={photo.url}
            target="_blank"
            rel="noreferrer noopener"
            className="shrink-0 uppercase tracking-[0.2em] text-white/60 transition hover:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            Original ↗
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
