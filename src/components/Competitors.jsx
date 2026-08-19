import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy } from 'lucide-react';
import DepthCarousel from './DepthCarousel';
import { EVENT } from '../data/event';

const items = EVENT.confirmed.map((c) => ({
  image: c.image,
  alt: c.name,
}));

export default function Competitors() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = EVENT.confirmed[activeIndex];

  return (
    <section
      id="competidores"
      className="relative overflow-hidden bg-racing-smoke py-20 md:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center"
        >
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-racing-gold">
            <Trophy size={14} />
            Ya confirmados
          </span>
          <h2 className="section-heading mt-3">
            Los <span className="text-racing-red">competidores</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/70">
            Las máquinas que ya apartaron su lugar en el arrancón.
          </p>
        </motion.div>
      </div>

      <div className="relative h-[420px] w-full md:h-[460px]">
        <DepthCarousel
          items={items}
          cardWidth={260}
          cardHeight={340}
          depth={200}
          spread={80}
          tilt={20}
          perspective={1300}
          visibleCards={3}
          autoplay={items.length > 1}
          loop
          tint="#0A0A0A"
          onChange={(idx) => setActiveIndex(idx)}
        />
      </div>

      <div className="mx-auto mt-8 max-w-md px-4 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={active.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <p className="display text-3xl uppercase text-white">
              {active.name}
            </p>
            <p className="mt-1 text-sm text-white/60">{active.note}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
