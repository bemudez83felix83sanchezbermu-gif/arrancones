import { motion } from 'framer-motion';
import { CalendarDays } from 'lucide-react';
import { EVENT } from '../data/event';

export default function Schedule() {
  return (
    <section id="programa" className="relative py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mb-14 text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-racing-red">
            Programa
          </span>
          <h2 className="section-heading mt-3">
            2 días de <span className="text-racing-red">adrenalina</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/70">
            Un fin de semana pensado para que no te pierdas nada. Aquí está el
            plan.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {EVENT.days.map((d, i) => (
            <motion.article
              key={d.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="group relative overflow-hidden border border-white/10 bg-racing-smoke"
            >
              <div className="stripe-red h-1.5 w-full" />

              <div className="p-6 md:p-8">
                <div className="flex items-center justify-between">
                  <span className="display text-5xl text-racing-red md:text-6xl">
                    {d.label}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-widest text-white/70">
                    <CalendarDays size={14} />
                    {d.date.split(' ').slice(0, 2).join(' ')}
                  </span>
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
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
