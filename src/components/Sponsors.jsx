import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import LogoLoop from './LogoLoop';

const CircularGallery = lazy(() => import('./CircularGallery'));

const GALLERY_ITEMS = [
  { image: '/sponsors/monreals_fondo.webp', text: "Auto Servicios Monreal's" },
  { image: '/sponsors/zepedas_slrc_fondo.webp', text: "Zepeda's" },
  { image: '/sponsors/juguetes_leon_fondo.webp', text: 'Vnts Leon' },
  { image: '/sponsors/wero_carwash_fondo.webp', text: "Wero's Car Wash" },
];

const LOOP_LOGOS = [
  { src: '/sponsors_s_fondo/monreals.webp', alt: "Auto Servicios Monreal's", title: "Auto Servicios Monreal's" },
  { src: '/sponsors_s_fondo/zepedas_slrc.webp', alt: "Zepeda's", title: "Zepeda's" },
  { src: '/sponsors_s_fondo/juguetes_leon.webp', alt: 'Vnts Leon', title: 'Vnts Leon' },
  { src: '/sponsors_s_fondo/wero_carwash.webp', alt: "Wero's Car Wash", title: "Wero's Car Wash" },
];

const LOOP_BG = '#F5F5F5';

export default function Sponsors() {
  const [preview, setPreview] = useState(null);
  const close = useCallback(() => setPreview(null), []);

  useEffect(() => {
    if (!preview) return undefined;
    const onKey = (event) => event.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [preview, close]);

  return (
    <section id="patrocinadores" className="relative overflow-hidden py-20 md:py-28">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-racing-red/10 to-transparent"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl px-4 text-center md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-racing-red">
            Nuestros patrocinadores
          </span>
          <h2 className="section-heading mt-3">
            Ellos hacen posible el <span className="text-racing-red">Car Fest 2K26</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base text-white/65 md:text-lg">
            Negocios locales que se suman a la fiesta del motorsport en Puerto Peñasco.
            Arrastra o desliza para conocerlos, y toca un logo para verlo completo.
          </p>
        </motion.div>
      </div>

      <div className="relative mt-10 h-[420px] w-full md:h-[560px]">
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-racing-red" />
            </div>
          }
        >
          <CircularGallery
            items={GALLERY_ITEMS}
            bend={2.5}
            textColor="#ffffff"
            borderRadius={0.06}
            scrollEase={0.09}
            scrollSpeed={3.6}
            fontUrl="https://fonts.googleapis.com/css2?family=Orbitron:wght@700&display=swap"
            font="bold 26px Orbitron"
            onItemClick={setPreview}
          />
        </Suspense>
      </div>

      <div
        className="mt-16 border-y border-white/10 py-8"
        style={{ backgroundColor: LOOP_BG }}
      >
        <LogoLoop
          logos={LOOP_LOGOS}
          speed={70}
          gap={80}
          logoHeight={64}
          pauseOnHover
          scaleOnHover
          fadeOut
          fadeOutColor={LOOP_BG}
          ariaLabel="Logos de patrocinadores del Car Fest 2K26"
        />
      </div>

      {preview && <Lightbox item={preview} onClose={close} />}
    </section>
  );
}

function Lightbox({ item, onClose }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col items-center">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar vista de patrocinador"
          className="absolute -top-2 right-0 -translate-y-full text-white/70 transition hover:text-white md:-right-2"
        >
          <X size={28} />
        </button>
        <img
          src={item.image}
          alt={item.text}
          className="max-h-[75vh] w-auto max-w-full border border-white/10 bg-white/5 object-contain"
          draggable={false}
        />
        {item.text && (
          <p className="mt-4 text-center text-sm font-semibold uppercase tracking-[0.2em] text-white/85 md:text-base">
            {item.text}
          </p>
        )}
      </div>
    </div>
  );
}
