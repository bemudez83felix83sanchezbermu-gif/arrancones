import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  Clock,
  ImagePlus,
  Images,
  Loader2,
  Play,
  ShieldCheck,
} from 'lucide-react';
import { Link } from '../router';
import {
  cldMediaThumb,
  cloudinaryConfig,
  formatDuration,
  isVideoUrl,
} from '../lib/cloudinary';
import { ALBUM_CATEGORIES, ALBUM_CATEGORY_IDS, UPLOADER_MAX } from '../../shared/album';

const WIDGET_SRC = 'https://widget.cloudinary.com/v2.0/global/all.js';

const RULES = [
  'Solo fotos y videos del Car Fest 2K26.',
  'Nada de desnudos, contenido sexual, violencia ni armas.',
  'Nada de groserías, símbolos de odio o burlas contra alguien.',
  'Respeta a los demás: no exhibas a nadie sin su permiso.',
];

let widgetScriptPromise = null;

function loadWidgetScript() {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.cloudinary?.createUploadWidget) return Promise.resolve();
  if (widgetScriptPromise) return widgetScriptPromise;
  widgetScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${WIDGET_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('widget')));
      return;
    }
    const script = document.createElement('script');
    script.src = WIDGET_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('widget'));
    document.head.appendChild(script);
  });
  return widgetScriptPromise;
}

const readCategoryParam = () => {
  const value = new URLSearchParams(window.location.search).get('cat');
  return value && ALBUM_CATEGORIES[value] ? value : '';
};

const widgetPalette = {
  window: '#0f1115',
  windowBorder: '#ffffff33',
  tabIcon: '#ff2a2a',
  menuIcons: '#ffffffaa',
  textDark: '#ffffff',
  textLight: '#ffffff',
  link: '#ff2a2a',
  action: '#ff2a2a',
  inactiveTabIcon: '#ffffff55',
  error: '#ff2a2a',
  inProgress: '#ff2a2a',
  complete: '#22c55e',
  sourceBg: '#181b21',
};

export default function AlbumUpload() {
  const { cloudName, uploadPreset, folder } = cloudinaryConfig;
  const configured = Boolean(cloudName && uploadPreset);

  const [name, setName] = useState('');
  const [category, setCategory] = useState(readCategoryParam);
  const [uploaded, setUploaded] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | loading | uploading | ready | error
  const [error, setError] = useState('');
  const widgetRef = useRef(null);
  // El callback del widget se crea una sola vez; la categoría del lote se lee de aquí.
  const batchCategoryRef = useRef('');

  useEffect(() => {
    if (!configured) {
      setStatus('error');
      setError('Falta configuración de Cloudinary. Avisa al organizador.');
      return undefined;
    }
    let cancelled = false;
    setStatus('loading');
    loadWidgetScript()
      .then(() => {
        if (cancelled) return;
        const widget = window.cloudinary.createUploadWidget(
          {
            cloudName,
            uploadPreset,
            folder,
            sources: ['local', 'camera'],
            multiple: true,
            maxFiles: 20,
            clientAllowedFormats: [
              'jpg',
              'jpeg',
              'png',
              'webp',
              'heic',
              'gif',
              'mp4',
              'mov',
              'webm',
              'm4v',
              '3gp',
            ],
            maxImageFileSize: 15_000_000,
            maxVideoFileSize: 60_000_000,
            resourceType: 'auto',
            language: 'es',
            showPoweredBy: false,
            styles: { palette: widgetPalette },
            text: {
              es: {
                or: 'o',
                menu: { files: 'Archivos', camera: 'Cámara' },
                selection_counter: { selected: 'Seleccionados' },
                queue: {
                  title: 'Subiendo tus archivos…',
                  abort_all: 'Cancelar todo',
                  done: 'Listo',
                },
                local: {
                  browse: 'Elegir fotos o videos',
                  dd_title_single: 'Arrastra tu foto o video aquí',
                  dd_title_multi: 'Arrastra tus fotos o videos aquí',
                  drop_title_single: 'Suelta tu archivo',
                  drop_title_multiple: 'Suelta tus archivos',
                },
                camera: {
                  capture: 'Tomar foto',
                  cancel: 'Cancelar',
                  take_pic: 'Tomar foto',
                  explanation: 'Toma una foto con la cámara del teléfono.',
                },
                actions: { upload: 'Subir', clear_all: 'Limpiar', done: 'Listo' },
              },
            },
          },
          (err, result) => {
            if (err) {
              setStatus('error');
              setError(err.statusText || err.message || 'No pudimos subir tus fotos.');
              return;
            }
            if (!result) return;
            if (result.event === 'upload-added') {
              setStatus('uploading');
              setError('');
            }
            if (result.event === 'success') {
              const info = result.info;
              setUploaded((prev) => {
                if (prev.some((p) => p.id === info.public_id)) return prev;
                return [
                  {
                    id: info.public_id,
                    url: info.secure_url,
                    width: info.width,
                    height: info.height,
                    resourceType: info.resource_type || 'image',
                    duration: info.duration || null,
                    category: batchCategoryRef.current,
                  },
                  ...prev,
                ];
              });
            }
            if (result.event === 'queues-end') {
              setStatus('ready');
            }
            if (result.event === 'abort') {
              setStatus('ready');
            }
          },
        );
        widgetRef.current = widget;
        setStatus((prev) => (prev === 'loading' ? 'ready' : prev));
      })
      .catch(() => {
        if (cancelled) return;
        setStatus('error');
        setError('No pudimos cargar el widget de subida. Intenta recargar la página.');
      });

    return () => {
      cancelled = true;
      try {
        widgetRef.current?.destroy?.({ removeThumbnails: true });
      } catch {
        // ignore
      }
      widgetRef.current = null;
    };
  }, [cloudName, uploadPreset, folder, configured]);

  const openWidget = useCallback(() => {
    const widget = widgetRef.current;
    if (!widget || !category) return;
    const trimmed = name.trim().slice(0, UPLOADER_MAX);
    batchCategoryRef.current = category;
    try {
      widget.update({
        context: trimmed ? { uploader: trimmed, category } : { category },
        tags: trimmed ? ['carfest2k26-album', `by:${trimmed}`] : ['carfest2k26-album'],
      });
    } catch {
      // ignore, widget might not accept update on some versions
    }
    widget.open();
  }, [name, category]);

  const canOpen = (status === 'ready' || status === 'uploading') && Boolean(category);

  const stats = useMemo(() => {
    if (!uploaded.length) return null;
    const videos = uploaded.filter((u) => u.resourceType === 'video').length;
    const photos = uploaded.length - videos;
    const parts = [];
    if (photos) parts.push(`${photos} foto${photos === 1 ? '' : 's'}`);
    if (videos) parts.push(`${videos} video${videos === 1 ? '' : 's'}`);
    return parts.join(' · ');
  }, [uploaded]);

  return (
    <div className="min-h-screen bg-racing-asphalt text-white">
      <Backdrop />

      <header className="relative z-10 border-b border-white/10 bg-racing-asphalt/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 md:px-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-white/60 transition hover:text-white"
          >
            <ArrowLeft size={14} /> Inicio
          </Link>
          <Link
            to="/album"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-white/60 transition hover:text-white"
          >
            <Images size={14} /> Ver álbum
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-3xl px-4 py-10 md:px-8 md:py-16">
        <div className="mb-8">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-racing-red">
            Car Fest 2K26
          </span>
          <h1 className="display mt-3 text-4xl leading-tight md:text-6xl">
            Sube tus fotos y videos del evento
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/60 md:text-base">
            Elige la sección, sube lo mejor del día y el equipo lo revisa antes de publicarlo en el
            álbum. Fotos hasta 15&nbsp;MB, videos hasta 60&nbsp;MB.
          </p>
        </div>

        <div className="border border-white/10 bg-white/[0.03] p-5 shadow-[0_20px_60px_-30px_rgba(255,42,42,0.35)] md:p-8">
          <fieldset>
            <legend className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
              1. ¿De qué son tus fotos?
            </legend>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {ALBUM_CATEGORY_IDS.map((id) => {
                const cat = ALBUM_CATEGORIES[id];
                const active = category === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setCategory(id)}
                    aria-pressed={active}
                    className={`relative flex min-w-0 flex-col items-start gap-1 border px-3 py-3 text-left transition ${
                      active ? 'bg-white/[0.07]' : 'border-white/15 bg-black/30 hover:border-white/35'
                    }`}
                    style={active ? { borderColor: cat.color } : undefined}
                  >
                    <span className="flex w-full items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="truncate text-sm font-semibold text-white">{cat.label}</span>
                      {active && (
                        <CheckCircle2 size={14} className="ml-auto shrink-0" style={{ color: cat.color }} />
                      )}
                    </span>
                    <span className="text-[11px] leading-snug text-white/45">{cat.hint}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <label className="mt-6 block">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
              2. Tu nombre (opcional)
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Andrés M."
              maxLength={UPLOADER_MAX}
              className="mt-2 w-full border border-white/15 bg-black/40 px-4 py-3 text-white placeholder:text-white/30 focus:border-racing-red focus:outline-none"
            />
            <span className="mt-1.5 block text-[11px] text-white/40">
              Para dar crédito de la foto en el álbum. Puedes dejarlo vacío.
            </span>
          </label>

          <button
            type="button"
            onClick={openWidget}
            disabled={!canOpen}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 bg-racing-red px-6 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-racing-red/85 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === 'loading' ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Preparando…
              </>
            ) : status === 'uploading' ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Subiendo…
              </>
            ) : !category ? (
              'Elige una sección arriba'
            ) : (
              <>
                <ImagePlus size={18} />
                Subir a {ALBUM_CATEGORIES[category].short}
              </>
            )}
          </button>

          <p className="mt-3 flex items-start justify-center gap-2 text-center text-[11px] text-white/40">
            <Camera size={12} className="mt-px shrink-0" /> Puedes elegir de tu galería o tomar la
            foto ahí mismo. En el selector de tu celular está la opción de grabar video.
          </p>
        </div>

        <section className="mt-6 border border-emerald-400/20 bg-emerald-400/[0.04] p-5">
          <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            <ShieldCheck size={14} /> Antes de subir
          </h2>
          <ul className="mt-3 space-y-1.5 text-sm text-white/65">
            {RULES.map((rule) => (
              <li key={rule} className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-white/40" />
                {rule}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] leading-relaxed text-white/40">
            Todo pasa por revisión: lo que no cumpla no se publica y se elimina.
          </p>
        </section>

        {status === 'error' && error ? (
          <div className="mt-6 flex items-start gap-2 border border-racing-red/40 bg-racing-red/10 p-4 text-sm text-white/80">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-racing-red" />
            <span>{error}</span>
          </div>
        ) : null}

        <AnimatePresence>
          {uploaded.length > 0 && (
            <motion.section
              key="uploaded"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="mt-10"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-white/70">
                  Lo que acabas de subir
                </h2>
                {stats && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
                    <CheckCircle2 size={13} /> {stats}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 md:grid-cols-4">
                {uploaded.map((item) => {
                  const isVideo = item.resourceType === 'video' || isVideoUrl(item.url);
                  const cat = ALBUM_CATEGORIES[item.category];
                  return (
                    <div
                      key={item.id}
                      className="relative aspect-square overflow-hidden border border-white/10 bg-black/40"
                    >
                      <img
                        src={cldMediaThumb(item.url)}
                        alt={isVideo ? 'Video subido' : 'Foto subida'}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                      {isVideo && (
                        <>
                          <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-black">
                              <Play size={14} className="translate-x-[1px]" />
                            </span>
                          </span>
                          {item.duration ? (
                            <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                              {formatDuration(item.duration)}
                            </span>
                          ) : null}
                        </>
                      )}
                      <span className="absolute left-1 top-1 inline-flex items-center gap-1 bg-black/75 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-amber-200">
                        <Clock size={9} /> En revisión
                      </span>
                      {cat && (
                        <span className="absolute bottom-1 left-1 inline-flex items-center gap-1 bg-black/75 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.12em] text-white/75">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cat.color }} />
                          {cat.short}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="mt-4 text-xs leading-relaxed text-white/45">
                Gracias por compartir. El equipo revisa cada archivo y, en cuanto lo apruebe,
                aparece en{' '}
                <Link to="/album" className="text-racing-red hover:underline">
                  el álbum público
                </Link>{' '}
                dentro de su sección.
              </p>
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function Backdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-racing-red/12 blur-[140px]" />
      <div className="absolute bottom-0 right-[-160px] h-[420px] w-[420px] rounded-full bg-racing-red/6 blur-[160px]" />
    </div>
  );
}
