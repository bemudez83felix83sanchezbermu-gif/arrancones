import { motion } from 'framer-motion';
import { MapPin, Calendar, ArrowDown } from 'lucide-react';
import Countdown from './Countdown';
import { EVENT, WHATSAPP_URL } from '../data/event';

export default function Hero() {
  return (
    <section
      id="top"
      className="relative isolate flex min-h-screen items-center overflow-hidden pt-24"
    >
      {/* Background image */}
      <div
        className="absolute inset-0 -z-20 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${EVENT.media.hero})` }}
      />
      {/* Overlays */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-racing-asphalt/70 via-racing-asphalt/60 to-racing-asphalt" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(10,10,10,0.9)_80%)]" />

      {/* Animated racing stripe */}
      <div className="pointer-events-none absolute top-32 left-0 w-full overflow-hidden opacity-20">
        <div className="h-1 w-1/3 animate-slide-stripe bg-racing-red" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 py-16 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-racing-red/50 bg-racing-red/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-racing-red">
            <span className="h-2 w-2 animate-pulse rounded-full bg-racing-red" />
            Puerto Peñasco · Sonora
          </span>

          <h1 className="display mt-6 text-6xl leading-none text-white md:text-[9rem]">
            CAR FEST
            <br />
            <span className="text-racing-red">2K26</span>
          </h1>

          <p className="mt-4 max-w-xl text-lg text-white/80 md:text-xl">
            {EVENT.slogan}. Drift, car show, arrancones y más.{' '}
            <span className="text-racing-gold">{EVENT.tagline}</span>
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-white/80">
            <span className="inline-flex items-center gap-2 text-sm md:text-base">
              <Calendar size={18} className="text-racing-red" />
              {EVENT.displayDate}
            </span>
            <span className="hidden text-white/30 md:inline">·</span>
            <span className="inline-flex items-center gap-2 text-sm md:text-base">
              <MapPin size={18} className="text-racing-red" />
              {EVENT.venue}, {EVENT.city}
            </span>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href={WHATSAPP_URL(
                'Hola! Quiero información sobre el Car Fest 2K26 en Puerto Peñasco.',
              )}
              target="_blank"
              rel="noreferrer"
              className="btn-racing"
            >
              Quiero información
            </a>
            <a href="#programa" className="btn-ghost">
              Ver programa
            </a>
          </div>
        </motion.div>

        {/* Countdown */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-14 rounded-xl border border-white/10 bg-black/40 p-6 backdrop-blur-md md:p-8"
        >
          <div className="mb-5 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
              Faltan
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-racing-red">
              Para el arranque
            </span>
          </div>
          <Countdown target={EVENT.startDate} />
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.a
        href="#evento"
        aria-label="Bajar"
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 1.8 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 hover:text-white"
      >
        <ArrowDown size={26} />
      </motion.a>
    </section>
  );
}
