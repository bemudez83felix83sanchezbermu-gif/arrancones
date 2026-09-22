import { motion } from 'framer-motion';
import { CalendarDays, Clock, MapPin, Navigation } from 'lucide-react';
import { EVENT, MAPS_URL } from '../data/event';
import { useEventPhase } from '../lib/eventPhase';

export default function Schedule() {
  const { today } = useEventPhase();

  return (
    <section id="programa" className="relative py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mb-14 text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-racing-red">
            Programa
          </span>
          <h2 className="section-heading mt-3">
            {EVENT.days.length} días de <span className="text-racing-red">adrenalina</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/70">
            Un fin de semana pensado para que no te pierdas nada. Aquí está el
            plan.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {EVENT.days.map((d, i) => {
            const isToday = today?.iso === d.iso;
            return (
              <motion.article
                key={d.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className={`group relative flex flex-col overflow-hidden border bg-racing-smoke ${
                  isToday ? 'border-racing-red shadow-[0_0_40px_rgba(225,6,0,0.25)]' : 'border-white/10'
                }`}
              >
                <div className="stripe-red h-1.5 w-full" />

                <div className="flex flex-1 flex-col p-6 md:p-8">
                  <div className="flex items-center justify-between gap-3">
                    <span className="display text-5xl text-racing-red md:text-6xl">
                      {d.label}
                    </span>
                    {isToday ? (
                      <span className="inline-flex items-center gap-2 rounded-full bg-racing-red px-3 py-1 text-xs font-bold uppercase tracking-widest text-white">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                        Hoy
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-widest text-white/70">
                        <CalendarDays size={14} />
                        {d.date.split(' ').slice(0, 2).join(' ')}
                      </span>
                    )}
                  </div>

                  <h3 className="display mt-4 text-4xl uppercase text-white md:text-5xl">
                    {d.title}
                  </h3>
                  <p className="mt-2 text-sm text-white/50">{d.date}</p>

                  <p className="mt-6 text-white/70">{d.description}</p>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {d.activities.map((a) => (
                      <span
                        key={a}
                        className="border border-racing-red/40 bg-racing-red/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-racing-red"
                      >
                        {a}
                      </span>
                    ))}
                  </div>

                  {(d.time || d.place) && (
                    <div className="mt-6 space-y-2 border-t border-white/10 pt-5 text-sm text-white/70">
                      {d.time && (
                        <p className="flex items-center gap-2">
                          <Clock size={15} className="shrink-0 text-racing-red" /> {d.time}
                        </p>
                      )}
                      {d.agenda && (
                        <ul className="space-y-1.5 border-l-2 border-racing-red/40 py-1 pl-4">
                          {d.agenda.map((item) => (
                            <li key={item.label} className="flex flex-wrap justify-between gap-x-3">
                              <span className="font-semibold text-white">{item.label}</span>
                              <span className="text-white/55">{item.time}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {d.place && (
                        <p className="flex items-start gap-2">
                          <MapPin size={15} className="mt-0.5 shrink-0 text-racing-red" /> {d.place}
                        </p>
                      )}
                    </div>
                  )}

                  {d.mapsQuery && (
                    <a
                      href={MAPS_URL(d.mapsQuery)}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-auto inline-flex items-center gap-2 self-start pt-6 text-xs font-semibold uppercase tracking-wider text-white/70 transition hover:text-racing-red"
                    >
                      <Navigation size={14} /> Cómo llegar
                    </a>
                  )}
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
