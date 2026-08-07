import { motion } from 'framer-motion';
import { MapPin, Navigation } from 'lucide-react';
import { EVENT } from '../data/event';

const MAP_QUERY = encodeURIComponent(
  `${EVENT.venue}, ${EVENT.city}, Mexico`,
);

export default function Location() {
  return (
    <section id="ubicacion" className="relative py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mb-14 text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-racing-red">
            Ubicación
          </span>
          <h2 className="section-heading mt-3">
            ¿Dónde <span className="text-racing-red">nos vemos?</span>
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-[1fr_1.3fr]">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="border border-white/10 bg-racing-smoke p-6 md:p-8"
          >
            <MapPin className="text-racing-red" size={28} />
            <h3 className="display mt-4 text-3xl uppercase text-white md:text-4xl">
              {EVENT.venue}
            </h3>
            <p className="mt-2 text-white/70">{EVENT.city}</p>

            <div className="mt-6 space-y-3 border-t border-white/10 pt-6">
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Fechas</span>
                <span className="text-white">{EVENT.displayDate}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Duración</span>
                <span className="text-white">2 días completos</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Organiza</span>
                <span className="text-white">{EVENT.organizer}</span>
              </div>
            </div>

            <a
              href={`https://www.google.com/maps/search/?api=1&query=${MAP_QUERY}`}
              target="_blank"
              rel="noreferrer"
              className="btn-racing mt-8 w-full"
            >
              <Navigation size={16} />
              Cómo llegar
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="overflow-hidden border border-white/10 bg-racing-smoke"
          >
            <iframe
              title="Mapa Centro de Convenciones Puerto Peñasco"
              src={`https://www.google.com/maps?q=${MAP_QUERY}&output=embed`}
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: '360px' }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
