import { motion } from 'framer-motion';
import { Megaphone, Handshake, Star } from 'lucide-react';

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

export default function EventIntro() {
  return (
    <section id="evento" className="relative overflow-hidden py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="grid gap-14 md:grid-cols-[1.1fr_1fr] md:items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-racing-red">
              Sobre el evento
            </span>
            <h2 className="section-heading mt-3">
              El festival de <span className="text-racing-red">motorsport</span>
              <br /> más grande de la temporada
            </h2>
            <p className="mt-6 max-w-xl text-lg text-white/70">
              Dos días de adrenalina en el <strong className="text-white">Centro de Convenciones</strong> de Puerto Peñasco. Un día
              dedicado al <strong className="text-white">drift y car show</strong> con exposición de exóticos, tuning, lowrider,
              off-road y bikers; y otro día completo de <strong className="text-white">arrancones</strong>.
            </p>
            <p className="mt-4 max-w-xl text-lg text-white/70">
              Organiza <strong className="text-white">ALP Racing</strong>, en compañía de los mejores equipos y pilotos del noroeste.
            </p>
          </motion.div>

          <div className="grid gap-4">
            {perks.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group relative flex gap-4 border border-white/10 bg-racing-smoke/60 p-5 transition hover:border-racing-red/60"
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
