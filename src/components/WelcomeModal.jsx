import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BedDouble, MapPin, Sparkles, UtensilsCrossed, X } from 'lucide-react';
import { navigate } from '../router';

const STORAGE_KEY = 'carfest:welcomeModalDate';

function todayKey() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export default function WelcomeModal() {
  const [open, setOpen] = useState(false);

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

  const goToLodging = () => {
    close();
    navigate('/hospedaje');
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
              style={{
                background:
                  'radial-gradient(circle at 20% 0%, rgba(245,179,1,0.28) 0%, transparent 55%), radial-gradient(circle at 90% 100%, rgba(37,150,190,0.22) 0%, transparent 55%)',
              }}
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
                <span className="inline-flex items-center gap-1.5 rounded-full border border-racing-gold/40 bg-racing-gold/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-racing-gold">
                  <Sparkles size={12} /> Fin de semana especial
                </span>
              </div>

              <div>
                <h2
                  id="welcome-modal-title"
                  className="display text-4xl leading-tight text-white md:text-5xl"
                >
                  ¿Vienes de fuera <br />
                  <span className="text-racing-gold">al Car Fest 2K26?</span>
                </h2>
                <p className="mt-4 text-sm text-white/70 md:text-base">
                  Reserva con nosotros hospedaje, restaurantes y actividades en
                  Puerto Peñasco a los mejores precios y sin filas. Todo listo
                  para que solo pienses en disfrutar el evento.
                </p>
              </div>

              <ul className="grid grid-cols-3 gap-3 text-center text-[11px] font-medium uppercase tracking-wider text-white/75">
                <li className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-2 py-3">
                  <BedDouble size={18} className="text-racing-gold" />
                  Hospedaje
                </li>
                <li className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-2 py-3">
                  <UtensilsCrossed size={18} className="text-racing-gold" />
                  Gastronomía
                </li>
                <li className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-2 py-3">
                  <MapPin size={18} className="text-racing-gold" />
                  Actividades
                </li>
              </ul>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={goToLodging}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-racing-gold px-6 py-3 text-sm font-bold uppercase tracking-wider text-racing-asphalt transition hover:brightness-110"
                >
                  Ver opciones
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
