import { motion } from 'framer-motion';
import {
  BedDouble,
  CalendarDays,
  ClipboardList,
  Flag,
  MapPin,
  MessageCircle,
  Ticket,
  Timer,
} from 'lucide-react';
import { EVENT, MAPS_URL, WHATSAPP_URL } from '../data/event';
import { useEventPhase } from '../lib/eventPhase';
import { Link } from '../router';
import { CATEGORIES, openCategoryIds } from '../../shared/participants';

const parade = EVENT.days[0];
const showDay = EVENT.days[1];
const raceDay = EVENT.days[2];

// "Drift y Car Show hasta el viernes 25 · Arrancones hasta el sábado 26"
function registrationText() {
  const byClose = new Map();
  for (const id of openCategoryIds()) {
    const { label, closesLabel } = CATEGORIES[id];
    byClose.set(closesLabel, [...(byClose.get(closesLabel) ?? []), label]);
  }
  return [...byClose]
    .map(([closes, labels]) => `${labels.join(' y ')} hasta el ${closes}`)
    .join(' · ');
}

const money = (amount, currency) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);

/**
 * Lo que la gente pregunta por WhatsApp antes de venir: cuándo, dónde, cuánto
 * cuesta y cómo inscribirse. Cada tarjeta sale de `src/data/event.js`.
 */
function useFacts() {
  const { registrationOpen } = useEventPhase();
  const facts = [
    {
      icon: CalendarDays,
      title: 'Cuándo',
      text: `${EVENT.displayDate}. Viernes desfile, sábado drift y car show, domingo arrancones.`,
      action: { label: 'Ver programa', href: '#programa' },
    },
    {
      icon: Flag,
      title: `Desfile · ${parade.date.split(' ')[0]} ${parade.time}`,
      text: `${parade.place}.`,
      action: { label: 'Cómo llegar a la salida', href: MAPS_URL(parade.mapsQuery), external: true },
    },
    {
      icon: MapPin,
      title: 'Drift y car show',
      text: `${showDay.place} de ${EVENT.city}. ${showDay.date.split(' ')[0]} ${showDay.time}.`,
      action: { label: 'Cómo llegar', href: MAPS_URL(showDay.mapsQuery), external: true },
    },
    {
      icon: Timer,
      title: 'Arrancones',
      text: `${raceDay.place}. ${raceDay.date.split(' ')[0]} ${raceDay.time}.`,
      action: { label: 'Cómo llegar', href: raceDay.mapsUrl ?? MAPS_URL(raceDay.mapsQuery), external: true },
    },
  ];

  if (EVENT.admission) {
    facts.push({
      icon: Ticket,
      title: `${EVENT.admission.label} · ${money(EVENT.admission.price, EVENT.admission.currency)}`,
      text: `${EVENT.admission.note}. Pregunta por WhatsApp por otras entradas.`,
      action: {
        label: 'Preguntar',
        href: WHATSAPP_URL('Hola! ¿Qué entradas hay para el Car Fest 2K26?'),
        external: true,
      },
    });
  }

  if (registrationOpen) {
    facts.push({
      icon: ClipboardList,
      title: '¿Traes auto?',
      text: `Inscríbete en línea: ${registrationText()}.`,
      action: { label: 'Inscribirme', to: '/registro' },
    });
  }

  facts.push(
    {
      icon: BedDouble,
      title: '¿Vienes de fuera?',
      text: 'Hospedaje, restaurantes y actividades con la agencia oficial del evento.',
      action: { label: 'Ver hospedaje', to: '/hospedaje' },
    },
    {
      icon: MessageCircle,
      title: '¿Otra duda?',
      text: `Escríbenos al ${EVENT.contact.whatsappDisplay}.`,
      action: {
        label: 'Abrir WhatsApp',
        href: WHATSAPP_URL('Hola! Tengo una duda sobre el Car Fest 2K26.'),
        external: true,
      },
    },
  );

  return facts;
}

function FactAction({ action }) {
  const className =
    'mt-2 inline-flex text-xs font-semibold uppercase tracking-wider text-racing-red transition hover:text-white';
  if (action.to) {
    return (
      <Link to={action.to} className={className}>
        {action.label} →
      </Link>
    );
  }
  return (
    <a
      href={action.href}
      className={className}
      {...(action.external ? { target: '_blank', rel: 'noreferrer' } : {})}
    >
      {action.label} →
    </a>
  );
}

export default function EventIntro() {
  const facts = useFacts();

  return (
    <section id="evento" className="relative overflow-hidden py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="grid gap-14 md:grid-cols-[1fr_1.1fr] md:items-start">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="md:sticky md:top-28"
          >
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-racing-red">
              Sobre el evento
            </span>
            <h2 className="section-heading mt-3">
              El festival de <span className="text-racing-red">motorsport</span>
              <br /> más grande de la temporada
            </h2>
            <p className="mt-6 max-w-xl text-lg text-white/70">
              Tres días de adrenalina en Puerto Peñasco. Arrancamos el viernes con un{' '}
              <strong className="text-white">desfile por la ciudad</strong>; el sábado es de{' '}
              <strong className="text-white">drift y car show</strong> con exóticos, tuning,
              lowrider, off-road y bikers; y el domingo, un día completo de{' '}
              <strong className="text-white">arrancones</strong> en la {raceDay.place}.
            </p>
            <p className="mt-4 max-w-xl text-lg text-white/70">
              Organiza <strong className="text-white">ALP Racing</strong>, en compañía de los mejores equipos y pilotos del noroeste.
            </p>
          </motion.div>

          <div>
            <h3 className="display text-3xl uppercase text-white md:text-4xl">
              Lo que necesitas <span className="text-racing-red">saber</span>
            </h3>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {facts.map((fact, i) => (
                <motion.div
                  key={fact.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.05 }}
                  className="group flex gap-4 border border-white/10 bg-racing-smoke/60 p-4 transition hover:border-racing-red/60"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-racing-red/60 bg-racing-red/10 text-racing-red transition group-hover:bg-racing-red group-hover:text-white">
                    <fact.icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="display text-lg uppercase leading-tight text-white">{fact.title}</h4>
                    <p className="mt-1 text-sm text-white/65">{fact.text}</p>
                    {fact.action && <FactAction action={fact.action} />}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
