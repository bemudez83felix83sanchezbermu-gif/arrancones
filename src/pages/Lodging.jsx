import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  BedDouble,
  ExternalLink,
  Home,
  Info,
  MapPin,
  Ship,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import { Link } from '../router';
import LodgingImage from '../components/LodgingImage';
import { activities, hotels, houses, reservationLink, restaurants } from '../data/lodging';

const TABS = [
  { id: 'hospedaje', label: 'Hospedaje', icon: BedDouble },
  { id: 'gastronomia', label: 'Gastronomía', icon: UtensilsCrossed },
  { id: 'actividades', label: 'Actividades', icon: Ship },
];

const priceFormatters = {
  MXN: new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }),
  USD: new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'code',
    maximumFractionDigits: 0,
  }),
};

const formatPrice = (amount, code = 'MXN') => priceFormatters[code].format(amount);

export default function Lodging() {
  const [tab, setTab] = useState('hospedaje');

  return (
    <div className="min-h-screen bg-racing-asphalt text-white">
      <Backdrop />

      <header className="relative z-10 border-b border-white/10 bg-racing-asphalt/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/60 transition hover:text-white"
          >
            <ArrowLeft size={16} /> Volver al evento
          </Link>
          <span className="text-[10px] uppercase tracking-[0.3em] text-white/40">
            Reservaciones · Car Fest 2K26
          </span>
        </div>
      </header>

      <main className="relative z-10">
        <Hero />

        <section className="mx-auto max-w-6xl px-4 md:px-8">
          <TabBar tab={tab} onChange={setTab} />

          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="pb-16"
          >
            {tab === 'hospedaje' && <LodgingTab />}
            {tab === 'gastronomia' && <GenericGrid items={restaurants} kind="gastronomia" />}
            {tab === 'actividades' && <GenericGrid items={activities} kind="actividades" />}
          </motion.div>

          <ReservationsPartners />
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/10 py-8 text-center text-xs text-white/40">
        <p>
          Servicios coordinados por la agencia de viajes oficial del evento.
          Tarifas sujetas a disponibilidad.
        </p>
      </footer>
    </div>
  );
}

function ReservationsPartners() {
  const partners = [
    {
      name: 'Peñasco Tours & Aventura',
      logo: '/sponsors/penasco_tours_fondo.webp',
    },
    {
      name: 'Ingenia DS',
      logo: '/sponsors/ingenia_ds_fondo.webp',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5 }}
      className="mb-20 rounded-2xl border border-white/10 bg-racing-smoke/60 px-6 py-8 text-center backdrop-blur-sm md:px-10 md:py-10"
    >
      <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-racing-gold">
        Reservaciones a cargo de
      </span>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-6 md:gap-10">
        {partners.map((p) => (
          <div
            key={p.name}
            className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-2 transition duration-300 hover:border-racing-gold/40"
          >
            <img
              src={p.logo}
              alt={p.name}
              title={p.name}
              className="h-24 w-auto rounded-lg object-contain md:h-28"
              decoding="async"
            />
          </div>
        ))}
      </div>
      <p className="mx-auto mt-6 max-w-xl text-xs text-white/50 md:text-sm">
        Empresas oficiales encargadas de coordinar hospedaje, gastronomía y
        actividades durante el Car Fest 2K26.
      </p>
    </motion.div>
  );
}

function Backdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 opacity-70"
      style={{
        background:
          'radial-gradient(circle at 10% 0%, rgba(245,179,1,0.14) 0%, transparent 40%), radial-gradient(circle at 90% 15%, rgba(37,150,190,0.14) 0%, transparent 45%), radial-gradient(circle at 50% 100%, rgba(225,6,0,0.10) 0%, transparent 55%)',
      }}
    />
  );
}

function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-10 pt-14 md:px-8 md:pt-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl"
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-racing-gold/40 bg-racing-gold/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-racing-gold">
          Vive Puerto Peñasco
        </span>
        <h1 className="display mt-5 text-5xl leading-tight text-white md:text-7xl">
          Tu escapada al <span className="text-racing-gold">Car Fest 2K26</span>
        </h1>
        <p className="mt-5 max-w-2xl text-base text-white/70 md:text-lg">
          Reserva hospedaje, restaurantes y actividades con la agencia oficial
          del evento. Aprovecha tarifas preferentes por venir desde fuera y
          asegura tu lugar antes de que se agote.
        </p>
      </motion.div>
    </section>
  );
}

function TabBar({ tab, onChange }) {
  return (
    <div className="sticky top-0 z-20 -mx-4 mb-8 border-y border-white/10 bg-racing-asphalt/85 px-4 py-3 backdrop-blur md:mx-0 md:rounded-2xl md:border md:px-4">
      <div className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none] md:gap-2 [&::-webkit-scrollbar]:hidden">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={`inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition md:text-sm ${
                active
                  ? 'bg-racing-gold text-racing-asphalt shadow-[0_10px_30px_rgba(245,179,1,0.25)]'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Icon size={16} /> {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LodgingTab() {
  return (
    <div className="space-y-14">
      <div>
        <SectionHeading
          eyebrow="Hoteles"
          title="Hoteles con tarifa de agencia"
          description="Precios más bajos que reservando por tu cuenta. Confirmación inmediata por WhatsApp."
        />
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {hotels.map((hotel) => (
            <HotelCard key={hotel.slug} hotel={hotel} />
          ))}
        </div>
      </div>

      <div>
        <SectionHeading
          eyebrow="Casas"
          title="Casas Thomas en Comonfort"
          description="Estancias privadas tipo Airbnb, ideales para grupos y familias. Consulta disponibilidad y tarifas por noche con nosotros."
        />
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {houses.map((house) => (
            <HouseCard key={house.slug} house={house} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div>
      <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-racing-gold">
        {eyebrow}
      </span>
      <h2 className="display mt-2 text-3xl text-white md:text-4xl">{title}</h2>
      {description && (
        <p className="mt-3 max-w-2xl text-sm text-white/60 md:text-base">
          {description}
        </p>
      )}
    </div>
  );
}

function HotelCard({ hotel }) {
  const bestSaving = useMemo(() => {
    let best = { amount: 0, currency: 'MXN' };
    for (const r of hotel.rooms ?? []) {
      const amount = (r.priceStrike ?? 0) - (r.price ?? 0);
      if (amount > best.amount) best = { amount, currency: r.currency ?? 'MXN' };
    }
    return best;
  }, [hotel.rooms]);

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5 }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-racing-smoke/60 backdrop-blur-sm transition hover:border-racing-gold/40"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-black">
        <LodgingImage
          folder={hotel.folder}
          alt={hotel.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />
        {hotel.badge && (
          <span className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-racing-gold backdrop-blur">
            {hotel.badge}
          </span>
        )}
        {bestSaving.amount > 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-racing-gold px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-racing-asphalt">
            Ahorra {formatPrice(bestSaving.amount, bestSaving.currency)}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <h3 className="display text-2xl text-white">{hotel.name}</h3>
          <p className="mt-1 text-sm text-white/60">{hotel.tagline}</p>
        </div>

        <ul className="space-y-3">
          {hotel.rooms.map((room) => (
            <li
              key={room.type}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{room.type}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] uppercase tracking-wider text-white/50">
                    <Users size={12} /> {room.capacity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="whitespace-nowrap text-lg font-bold text-racing-gold">
                    {formatPrice(room.price, room.currency)}
                  </p>
                  {room.priceStrike && room.priceStrike > room.price && (
                    <p className="whitespace-nowrap text-xs text-white/40 line-through">
                      {formatPrice(room.priceStrike, room.currency)}
                    </p>
                  )}
                  {room.priceLabel && (
                    <p className="mt-0.5 text-[10px] uppercase tracking-wider text-white/40">
                      {room.priceLabel}
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>

        {hotel.notes?.length > 0 && (
          <div className="flex items-start gap-2 rounded-lg bg-white/[0.03] px-3 py-2 text-[11px] text-white/55">
            <Info size={13} className="mt-0.5 flex-none text-racing-gold" />
            <p>{hotel.notes.join(' ')}</p>
          </div>
        )}

        <div className="mt-auto flex flex-col gap-2 pt-2 sm:flex-row">
          <a
            href={reservationLink(hotel)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-racing-gold px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-racing-asphalt transition hover:brightness-110"
          >
            Reservar
          </a>
          <a
            href={hotel.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white/75 transition hover:border-white/40 hover:text-white"
          >
            <MapPin size={13} /> Ver mapa
          </a>
        </div>
      </div>
    </motion.article>
  );
}

function HouseCard({ house }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5 }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-racing-smoke/60 backdrop-blur-sm transition hover:border-racing-gold/40"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-black">
        <LodgingImage
          folder={house.folder}
          alt={house.name}
          icon={Home}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />
        {house.badge && (
          <span className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-racing-gold backdrop-blur">
            {house.badge}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <h3 className="display text-2xl text-white">{house.name}</h3>
          <p className="mt-1 text-sm text-white/60">{house.tagline}</p>
        </div>

        {house.priceStatus && (
          <div className="flex items-start gap-2 rounded-lg bg-white/[0.03] px-3 py-2 text-[11px] text-white/55">
            <Info size={13} className="mt-0.5 flex-none text-racing-gold" />
            <p>{house.priceStatus}</p>
          </div>
        )}

        <div className="mt-auto pt-2">
          <a
            href={reservationLink(house, 'Quiero información y disponibilidad.')}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-racing-gold px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-racing-asphalt transition hover:brightness-110"
          >
            Consultar disponibilidad
          </a>
        </div>
      </div>
    </motion.article>
  );
}

function GenericGrid({ items, kind }) {
  const eyebrow = kind === 'gastronomia' ? 'Restaurantes' : 'Actividades';
  const title =
    kind === 'gastronomia'
      ? 'Come sin filas y con atención prioritaria'
      : 'Vive Puerto Peñasco a otro nivel';
  const description =
    kind === 'gastronomia'
      ? 'Reserva mesa con la agencia y garantiza tu lugar durante el fin de semana del evento.'
      : 'Actividades coordinadas para el fin de semana del Car Fest. Reserva tu pulsera con nosotros.';

  return (
    <div>
      <SectionHeading eyebrow={eyebrow} title={title} description={description} />
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {items.map((item) => (
          <ExperienceCard key={item.slug} item={item} kind={kind} />
        ))}
      </div>
    </div>
  );
}

function ExperienceCard({ item, kind }) {
  const Icon = kind === 'gastronomia' ? UtensilsCrossed : Ship;
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5 }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-racing-smoke/60 backdrop-blur-sm transition hover:border-racing-gold/40 md:flex-row"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-black md:aspect-auto md:w-2/5">
        <LodgingImage
          folder={item.folder}
          alt={item.name}
          icon={Icon}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />
        {item.badge && (
          <span className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-racing-gold backdrop-blur">
            {item.badge}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <h3 className="display text-2xl text-white">{item.name}</h3>
          <p className="mt-1 text-sm text-white/60">{item.tagline}</p>
        </div>

        {item.highlights?.length > 0 && (
          <ul className="space-y-1.5 text-xs text-white/70">
            {item.highlights.map((h) => (
              <li key={h} className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 flex-none rounded-full bg-racing-gold" />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto flex flex-col gap-2 pt-2 sm:flex-row">
          <a
            href={reservationLink(item)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-racing-gold px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-racing-asphalt transition hover:brightness-110"
          >
            Reservar
          </a>
          {item.externalUrl && (
            <a
              href={item.externalUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white/75 transition hover:border-white/40 hover:text-white"
            >
              <ExternalLink size={13} /> {item.externalLabel ?? 'Sitio oficial'}
            </a>
          )}
          <a
            href={item.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white/75 transition hover:border-white/40 hover:text-white"
          >
            <MapPin size={13} /> Ver mapa
          </a>
        </div>
      </div>
    </motion.article>
  );
}
