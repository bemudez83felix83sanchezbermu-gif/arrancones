import { motion } from 'framer-motion';
import {
  Flame,
  Sparkles,
  Timer,
  Gem,
  Wrench,
  Car,
  Mountain,
  Bike,
} from 'lucide-react';
import { EVENT } from '../data/event';

const iconMap = {
  flame: Flame,
  sparkles: Sparkles,
  timer: Timer,
  gem: Gem,
  wrench: Wrench,
  car: Car,
  mountain: Mountain,
  bike: Bike,
};

export default function Categories() {
  return (
    <section
      id="categorias"
      className="relative overflow-hidden border-y border-white/5 bg-racing-smoke py-20 md:py-28"
    >
      {/* Diagonal stripe */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 stripe-red opacity-40" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 stripe-red opacity-40" />

      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mb-14 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-racing-red">
              Qué vas a ver
            </span>
            <h2 className="section-heading mt-3">
              Categorías <span className="text-racing-red">del evento</span>
            </h2>
          </div>
          <p className="max-w-md text-white/70">
            Ocho categorías. Autos, motos, drift, exóticos y las mejores máquinas
            de la región reunidas en un solo lugar.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {EVENT.categories.map((cat, i) => {
            const Icon = iconMap[cat.icon] || Car;
            return (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.45, delay: i * 0.05 }}
                whileHover={{ y: -6 }}
                className="group relative overflow-hidden border border-white/10 bg-racing-asphalt p-6 transition-colors hover:border-racing-red"
              >
                <div className="absolute -right-6 -top-6 h-24 w-24 rotate-12 bg-racing-red/5 transition group-hover:bg-racing-red/10" />
                <Icon
                  size={38}
                  className="text-racing-red transition group-hover:scale-110"
                />
                <h3 className="display mt-4 text-2xl uppercase text-white">
                  {cat.name}
                </h3>
                <span className="mt-2 block text-xs uppercase tracking-widest text-white/40">
                  0{i + 1}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
