import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AtSign, ExternalLink, Facebook, Instagram, Trophy } from 'lucide-react';
import DepthCarousel from './DepthCarousel';
import { EVENT } from '../data/event';
import { listPublicParticipants } from '../lib/api';
import {
  CATEGORIES,
  raceClassLabel,
  socialLabel,
  socialLink,
} from '../../shared/participants';

const toCarouselItem = (participant) => ({
  key: `p-${participant.id}`,
  name: participant.vehicle_name,
  image: participant.vehicle_photo,
  alt: `${participant.vehicle_name} — ${participant.pilot_name}`,
  pilot: participant.pilot_name,
  category: participant.category,
  raceClass: participant.race_class,
  social: participant.social,
});

const fromEventFallback = (entry, index) => ({
  key: `f-${index}`,
  name: entry.name,
  image: entry.image,
  alt: entry.name,
  pilot: entry.note,
  category: null,
  raceClass: null,
  social: null,
});

const detectNetwork = (value = '') => {
  const v = value.toLowerCase();
  if (v.includes('instagram.com') || v.includes('instagr.am')) return 'instagram';
  if (v.includes('facebook.com') || v.includes('fb.com') || v.includes('fb.me')) return 'facebook';
  if (v.startsWith('@')) return 'instagram';
  return 'link';
};

const prettySocialLabel = (network, value) => {
  const href = socialLink(value);
  if (!href) return value;
  const clean = socialLabel(href).split('?')[0].replace(/\/+$/, '');
  if (network === 'instagram' || network === 'facebook') {
    const handle = clean.split('/').filter(Boolean).pop();
    if (handle) return `@${handle}`;
  }
  return clean;
};

function SocialPill({ value }) {
  const href = socialLink(value);
  const network = detectNetwork(value);
  const Icon = network === 'instagram' ? Instagram : network === 'facebook' ? Facebook : network === 'link' ? ExternalLink : AtSign;
  const label = prettySocialLabel(network, value);

  const inner = (
    <>
      <Icon size={14} className="shrink-0" />
      <span className="truncate">{label}</span>
    </>
  );

  const base =
    'inline-flex max-w-full items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3.5 py-1.5 text-xs font-semibold tracking-wide text-white/85 transition';

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className={`${base} hover:border-racing-red/60 hover:bg-racing-red/10 hover:text-white`}
      >
        {inner}
      </a>
    );
  }
  return <span className={base}>{inner}</span>;
}

export default function Competitors() {
  const [participants, setParticipants] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    let alive = true;
    listPublicParticipants()
      .then((rows) => {
        if (alive) setParticipants(rows);
      })
      .catch(() => {
        // Si el endpoint falla se muestran los del fallback estático.
      });
    return () => {
      alive = false;
    };
  }, []);

  const cards = useMemo(() => {
    if (participants.length > 0) return participants.map(toCarouselItem);
    return EVENT.confirmed.map(fromEventFallback);
  }, [participants]);

  const active = cards[activeIndex] ?? cards[0];
  const category = active?.category ? CATEGORIES[active.category] : null;
  const categoryColor = category?.color ?? '#E10600';
  const raceLabel = active?.raceClass ? raceClassLabel(active.raceClass) : null;

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
          items={cards}
          cardWidth={260}
          cardHeight={340}
          depth={200}
          spread={80}
          tilt={20}
          perspective={1300}
          visibleCards={3}
          autoplay={cards.length > 1}
          loop
          tint="#0A0A0A"
          onChange={(idx) => setActiveIndex(idx)}
        />
      </div>

      {active && (
        <div className="mx-auto mt-8 max-w-lg px-4">
          <motion.div
            key={active.key ?? active.name}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="flex flex-col items-center text-center"
          >
            {(category || raceLabel) && (
              <span
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em]"
                style={{
                  borderColor: `${categoryColor}55`,
                  backgroundColor: `${categoryColor}18`,
                  color: categoryColor,
                }}
              >
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: categoryColor }}
                />
                {category?.label ?? 'Confirmado'}
                {raceLabel && <span className="text-white/60">· {raceLabel}</span>}
              </span>
            )}

            <h3
              className="display mt-3 text-4xl uppercase text-white md:text-5xl"
              style={{ textShadow: `0 6px 24px ${categoryColor}33` }}
            >
              {active.name}
            </h3>

            {active.pilot && (
              <p className="mt-2 text-sm uppercase tracking-[0.24em] text-white/55">
                {active.pilot}
              </p>
            )}

            {active.social && (
              <div className="mt-4">
                <SocialPill value={active.social} />
              </div>
            )}
          </motion.div>
        </div>
      )}
    </section>
  );
}
