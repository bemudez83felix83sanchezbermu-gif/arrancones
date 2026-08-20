import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const pad = (n) => String(n).padStart(2, '0');

function diff(target) {
  const now = Date.now();
  const t = new Date(target).getTime();
  const d = Math.max(0, t - now);
  const days = Math.floor(d / (1000 * 60 * 60 * 24));
  const hours = Math.floor((d / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((d / (1000 * 60)) % 60);
  const seconds = Math.floor((d / 1000) % 60);
  return { days, hours, minutes, seconds, over: d === 0 };
}

function Unit({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden border-2 border-racing-red/60 bg-racing-asphalt/80 backdrop-blur sm:h-20 sm:w-20 md:h-28 md:w-28">
        <div className="absolute inset-x-0 top-1/2 h-px bg-white/10" />
        <AnimatePresence mode="popLayout">
          <motion.span
            key={value}
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="display text-2xl text-white sm:text-4xl md:text-6xl"
          >
            {pad(value)}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="mt-2 text-[9px] font-semibold uppercase tracking-[0.28em] text-white/60 sm:text-[10px] sm:tracking-[0.3em] md:text-xs">
        {label}
      </span>
    </div>
  );
}

export default function Countdown({ target }) {
  const [t, setT] = useState(() => diff(target));

  useEffect(() => {
    const id = setInterval(() => setT(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (t.over) {
    return (
      <div className="flex items-center justify-center">
        <span className="display text-4xl text-racing-red md:text-6xl">
          ¡Ya estamos en vivo!
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-3 md:gap-6">
      <Unit value={t.days} label="Días" />
      <span className="display -mt-3 text-2xl text-racing-red sm:text-4xl md:text-6xl">:</span>
      <Unit value={t.hours} label="Horas" />
      <span className="display -mt-3 text-2xl text-racing-red sm:text-4xl md:text-6xl">:</span>
      <Unit value={t.minutes} label="Min" />
      <span className="display -mt-3 text-2xl text-racing-red sm:text-4xl md:text-6xl">:</span>
      <Unit value={t.seconds} label="Seg" />
    </div>
  );
}
