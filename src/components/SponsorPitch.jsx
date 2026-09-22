import { motion } from 'framer-motion';
import { Megaphone, Handshake, Star } from 'lucide-react';
import { WHATSAPP_URL } from '../data/event';

const perks = [
  {
    icon: Megaphone,
    title: 'Da visibilidad a tu marca',
    text: 'Llega a miles de personas apasionadas por los autos y el motorsport.',
  },
  {
    icon: Handshake,
    title: 'Conecta con tu público',
    text: 'Posiciona tu negocio frente a un público segmentado y altamente interesado.',
  },
  {
    icon: Star,
    title: 'Sé parte del espectáculo',
    text: 'Stands, patrocinios, activaciones y muchas formas de destacar tu marca.',
  },
];

/**
 * Invitación a patrocinar. Antes era la segunda sección de la landing; se movió
 * debajo de los patrocinadores porque a días del evento quien entra es público
 * o piloto, no marcas.
 */
export default function SponsorPitch() {
  return (
    <section className="relative pb-20 md:pb-28">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="border border-white/10 bg-racing-smoke/60 p-6 md:p-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-racing-red">
                Para marcas
              </span>
              <h2 className="display mt-2 text-4xl uppercase text-white md:text-5xl">
                ¿Quieres <span className="text-racing-red">patrocinar</span>?
              </h2>
            </div>
            <a
              href={WHATSAPP_URL('Hola! Me interesa patrocinar o poner un stand en el Car Fest 2K26.')}
              target="_blank"
              rel="noreferrer"
              className="btn-racing self-start md:self-auto"
            >
              Quiero patrocinar
            </a>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {perks.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group relative flex gap-4 border border-white/10 bg-racing-asphalt/60 p-5 transition hover:border-racing-red/60"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-racing-red/60 bg-racing-red/10 text-racing-red transition group-hover:bg-racing-red group-hover:text-white">
                  <p.icon size={22} />
                </div>
                <div>
                  <h3 className="display text-xl uppercase text-white">{p.title}</h3>
                  <p className="mt-1 text-sm text-white/70">{p.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
