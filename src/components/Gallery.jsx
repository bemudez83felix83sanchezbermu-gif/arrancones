import { motion } from 'framer-motion';
import { EVENT } from '../data/event';

const items = [
  { src: EVENT.media.hero, alt: 'Se están armando los tiros - Leon Racing' },
  { src: EVENT.media.sponsors, alt: 'Car Fest 2K26 - Da a conocer tu negocio' },
  { src: EVENT.media.lineup, alt: 'La Paloma quiere rival - Drift, Car Show y Arrancones' },
];

export default function Gallery() {
  return (
    <section id="galeria" className="relative overflow-hidden bg-racing-smoke py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mb-14 text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-racing-red">
            Galería
          </span>
          <h2 className="section-heading mt-3">
            Los <span className="text-racing-red">flyers</span> oficiales
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/70">
            El material que está corriendo en redes. Compártelo y ayúdanos a llenar
            el Centro de Convenciones.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {items.map((it, i) => (
            <motion.figure
              key={it.src}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -6 }}
              className="group relative overflow-hidden border border-white/10 bg-racing-asphalt"
            >
              <div className="aspect-[3/4] w-full overflow-hidden">
                <img
                  src={it.src}
                  alt={it.alt}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4">
                <p className="text-xs uppercase tracking-widest text-white/80">
                  Car Fest 2K26 · {i === 0 ? 'Anuncio' : i === 1 ? 'Patrocinios' : 'Rivales'}
                </p>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
