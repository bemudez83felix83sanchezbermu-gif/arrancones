import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BedDouble,
  Camera,
  Heart,
  Images,
  MapPin,
  Radio,
  Sparkles,
  UtensilsCrossed,
  Video,
  X,
} from 'lucide-react';
import { navigate } from '../router';
import { useEventPhase } from '../lib/eventPhase';

const STORAGE_KEY = 'carfest:welcomeModalDate';

/**
 * Un gancho distinto según el momento del fest: antes invita a reservar
 * hospedaje; durante, a subir fotos al álbum (la gente ya está en Peñasco);
 * después, a buscar sus fotos.
 */
const VARIANTS = {
  before: {
    accent: 'gold',
    badge: { icon: Sparkles, text: 'Fin de semana especial' },
    title: ['¿Vienes de fuera', 'al Car Fest 2K26?'],
    text: 'Reserva con nosotros hospedaje, restaurantes y actividades en Puerto Peñasco a los mejores precios y sin filas. Todo listo para que solo pienses en disfrutar el evento.',
    tiles: [
      { icon: BedDouble, label: 'Hospedaje' },
      { icon: UtensilsCrossed, label: 'Gastronomía' },
      { icon: MapPin, label: 'Actividades' },
    ],
    cta: 'Ver opciones',
    to: '/hospedaje',
  },
  live: {
    accent: 'red',
    badge: { icon: Radio, text: 'En vivo' },
    title: ['¿Estás en el', 'Car Fest 2K26?'],
    text: 'Sube tus fotos y videos al álbum oficial del evento. Las revisamos antes de publicarlas y quedan para que todos las vean.',
    tiles: [
      { icon: Camera, label: 'Fotos' },
      { icon: Video, label: 'Videos' },
      { icon: Images, label: 'Álbum' },
    ],
    cta: 'Subir fotos',
    to: '/album/subir',
  },
  after: {
    accent: 'red',
    badge: { icon: Heart, text: 'Gracias por venir' },
    title: ['Revive el', 'Car Fest 2K26'],
    text: 'Ya están en el álbum las fotos y videos del fin de semana. Búscate a ti y a tu auto.',
    tiles: [
      { icon: Camera, label: 'Fotos' },
      { icon: Video, label: 'Videos' },
      { icon: Images, label: 'Álbum' },
    ],
    cta: 'Ver álbum',
    to: '/album',
  },
};

const ACCENTS = {
  gold: {
    text: 'text-racing-gold',
    badge: 'border-racing-gold/40 bg-racing-gold/10 text-racing-gold',
    button: 'bg-racing-gold text-racing-asphalt',
    glow: 'radial-gradient(circle at 20% 0%, rgba(245,179,1,0.28) 0%, transparent 55%), radial-gradient(circle at 90% 100%, rgba(37,150,190,0.22) 0%, transparent 55%)',
  },
  red: {
    text: 'text-racing-red',
    badge: 'border-racing-red/50 bg-racing-red/10 text-racing-red',
    button: 'bg-racing-red text-white',
    glow: 'radial-gradient(circle at 20% 0%, rgba(225,6,0,0.28) 0%, transparent 55%), radial-gradient(circle at 90% 100%, rgba(245,179,1,0.16) 0%, transparent 55%)',
  },
};

function todayKey() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export default function WelcomeModal() {
  const [open, setOpen] = useState(false);
  const { phase } = useEventPhase();
  const variant = VARIANTS[phase] ?? VARIANTS.before;
  const accent = ACCENTS[variant.accent];

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    let last = null;
    try {
      last = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      // Modo privado o storage bloqueado; mostramos igual.
    }
    if (last === todayKey()) return undefined;
    const timer = window.setTimeout(() => setOpen(true), 900);
    return () => window.clearTimeout(timer);
  }, []);

  const close = () => {
    setOpen(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, todayKey());
    } catch {
      // Ignoramos errores de storage.
    }
  };

  const goToCta = () => {
    close();
    navigate(variant.to);
  };

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => event.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="welcome-modal"
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label="Cerrar"
            className="absolute inset-0 cursor-default bg-black/75 backdrop-blur-sm"
            onClick={close}
          />

          <motion.div
            role="dialog"
            aria-labelledby="welcome-modal-title"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-racing-smoke shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-70"
              aria-hidden="true"
              style={{ background: accent.glow }}
            />

            <button
              type="button"
              onClick={close}
              aria-label="Cerrar ventana"
              className="absolute right-3 top-3 z-20 rounded-full border border-white/10 bg-black/40 p-1.5 text-white/70 transition hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="relative z-10 flex flex-col gap-6 px-7 py-8 md:px-9 md:py-10">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${accent.badge}`}
                >
                  <variant.badge.icon size={12} /> {variant.badge.text}
                </span>
              </div>

              <div>
                <h2
                  id="welcome-modal-title"
                  className="display text-4xl leading-tight text-white md:text-5xl"
                >
                  {variant.title[0]} <br />
                  <span className={accent.text}>{variant.title[1]}</span>
                </h2>
                <p className="mt-4 text-sm text-white/70 md:text-base">{variant.text}</p>
              </div>

              <ul className="grid grid-cols-3 gap-3 text-center text-[11px] font-medium uppercase tracking-wider text-white/75">
                {variant.tiles.map((tile) => (
                  <li
                    key={tile.label}
                    className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-2 py-3"
                  >
                    <tile.icon size={18} className={accent.text} />
                    {tile.label}
                  </li>
                ))}
              </ul>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={goToCta}
                  className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold uppercase tracking-wider transition hover:brightness-110 ${accent.button}`}
                >
                  {variant.cta}
                </button>
                <button
                  type="button"
                  onClick={close}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-semibold uppercase tracking-wider text-white/70 transition hover:border-white/40 hover:text-white"
                >
                  Ahora no
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
