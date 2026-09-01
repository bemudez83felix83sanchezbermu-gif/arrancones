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
  { image: '/sponsors/dmentes_fondo.webp', text: 'Dmentes Drifts' },
  { image: '/sponsors/droid_fondo.webp', text: 'Droid' },
  { image: '/sponsors/rubios_fondo.webp', text: "Rubio's" },
  { image: '/sponsors/borracho_cantina_fondo.webp', text: 'Borracho Cantina' },
  { image: '/sponsors/oro_azteca_fondo.webp', text: 'Joyería Oro Azteca' },
  { image: '/sponsors/javier_castro_fondo.webp', text: 'Javier Castro y los del Puerto' },
  { image: '/sponsors/el_trompo_fondo.webp', text: 'Taquería El Trompo' },
  { image: '/sponsors/3_amigos_fondo.webp', text: '3 Amigos Deli-Snaiks' },
  { image: '/sponsors/penasco_fpv_fondo.webp', text: 'Peñasco FPV' },
  { image: '/sponsors/newave_fondo.webp', text: 'Newave' },
  { image: '/sponsors/luvisa_fondo.webp', text: 'Luvisa' },
  { image: '/sponsors/mr_sin_mamadas_fondo.webp', text: 'Mr. Sin Mamadas' },
  { image: '/sponsors/car_wash_el_charrito_fondo.webp', text: 'Car Wash El Charrito' },
  { image: '/sponsors/chavez_constructora_fondo.webp', text: 'Chávez Constructora' },
  { image: '/sponsors/el_solito_fondo.webp', text: 'Expendio Six El Solito' },
  { image: '/sponsors/ayuntamiento_fondo.webp', text: 'Ayuntamiento de Puerto Peñasco' },
  { image: '/sponsors/ingenia_ds_fondo.webp', text: 'Ingenia DS' },
  { image: '/sponsors/penasco_tours_fondo.webp', text: 'Peñasco Tours & Aventura' },
  { image: '/sponsors/ocean_rentals_fondo.webp', text: 'Océano Luxury Rentals' },
  { image: '/sponsors/mannys_fondo.webp', text: "Manny's Puerto Peñasco" },
  { image: '/sponsors/la_guia_rp_fondo.webp', text: 'La Guía de Puerto Peñasco' },
  { image: '/sponsors/ruben_gonzalez_fondo.webp', text: 'Rubén González' },
  { image: '/sponsors/ALP.webp', text: 'ALP Racing' },
];

const LOOP_LOGOS = [
  { src: '/sponsors_s_fondo/monreals.webp', alt: "Auto Servicios Monreal's", title: "Auto Servicios Monreal's" },
  { src: '/sponsors_s_fondo/zepedas_slrc.webp', alt: "Zepeda's", title: "Zepeda's" },
  { src: '/sponsors_s_fondo/juguetes_leon.webp', alt: 'Vnts Leon', title: 'Vnts Leon' },
  { src: '/sponsors_s_fondo/wero_carwash.webp', alt: "Wero's Car Wash", title: "Wero's Car Wash" },
  { src: '/sponsors_s_fondo/dmentes_drifts.webp', alt: 'Dmentes Drifts', title: 'Dmentes Drifts' },
  { src: '/sponsors_s_fondo/droid_s_fondo.webp', alt: 'Droid', title: 'Droid' },
  { src: '/sponsors_s_fondo/rubios_s_fondo.webp', alt: "Rubio's", title: "Rubio's" },
  { src: '/sponsors_s_fondo/borracho_cantina.webp', alt: 'Borracho Cantina', title: 'Borracho Cantina' },
  { src: '/sponsors_s_fondo/oro_azteca.webp', alt: 'Joyería Oro Azteca', title: 'Joyería Oro Azteca' },
  { src: '/sponsors_s_fondo/javier_castro.webp', alt: 'Javier Castro y los del Puerto', title: 'Javier Castro y los del Puerto' },
  { src: '/sponsors_s_fondo/el_trompo.webp', alt: 'Taquería El Trompo', title: 'Taquería El Trompo' },
  { src: '/sponsors_s_fondo/3_amigos_s_fondo.webp', alt: '3 Amigos Deli-Snaiks', title: '3 Amigos Deli-Snaiks' },
  { src: '/sponsors_s_fondo/penasco_fpv.webp', alt: 'Peñasco FPV', title: 'Peñasco FPV' },
  { src: '/sponsors_s_fondo/newave.webp', alt: 'Newave', title: 'Newave' },
  { src: '/sponsors_s_fondo/luvisa.webp', alt: 'Luvisa', title: 'Luvisa' },
  { src: '/sponsors_s_fondo/mr_sin_mamadas.webp', alt: 'Mr. Sin Mamadas', title: 'Mr. Sin Mamadas' },
  { src: '/sponsors_s_fondo/chavez_constructora.webp', alt: 'Chávez Constructora', title: 'Chávez Constructora' },
  { src: '/sponsors_s_fondo/el_solito.webp', alt: 'Expendio Six El Solito', title: 'Expendio Six El Solito' },
  { src: '/sponsors_s_fondo/ayuntamiento.webp', alt: 'Ayuntamiento de Puerto Peñasco', title: 'Ayuntamiento de Puerto Peñasco' },
  { src: '/sponsors_s_fondo/ingenia_ds.webp', alt: 'Ingenia DS', title: 'Ingenia DS' },
  { src: '/sponsors_s_fondo/penasco_tours.webp', alt: 'Peñasco Tours & Aventura', title: 'Peñasco Tours & Aventura' },
  { src: '/sponsors_s_fondo/ocean_rentals.webp', alt: 'Océano Luxury Rentals', title: 'Océano Luxury Rentals' },
  { src: '/sponsors_s_fondo/mannys.webp', alt: "Manny's Puerto Peñasco", title: "Manny's Puerto Peñasco" },
  { src: '/sponsors_s_fondo/la_guia_rp.webp', alt: 'La Guía de Puerto Peñasco', title: 'La Guía de Puerto Peñasco' },
  { src: '/sponsors_s_fondo/ruben_gonzalez.webp', alt: 'Rubén González', title: 'Rubén González' },
  { src: '/sponsors_s_fondo/ALP.WEBP', alt: 'ALP Racing', title: 'ALP Racing' },
];

const LOOP_BG = '#F5F5F5';

function useIsMobile(query = '(max-width: 767px)') {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mql = window.matchMedia(query);
    const onChange = (event) => setIsMobile(event.matches);
    mql.addEventListener('change', onChange);
    setIsMobile(mql.matches);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return isMobile;
}

export default function Sponsors() {
  const [preview, setPreview] = useState(null);
  const isMobile = useIsMobile();
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

      <div className="relative mt-10 h-[340px] w-full sm:h-[420px] md:h-[560px]">
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-racing-red" />
            </div>
          }
        >
          <CircularGallery
            items={GALLERY_ITEMS}
            bend={isMobile ? 0.8 : 2.5}
            textColor="#ffffff"
            borderRadius={0.06}
            scrollEase={0.09}
            scrollSpeed={isMobile ? 2.4 : 3.6}
            fontUrl="https://fonts.googleapis.com/css2?family=Orbitron:wght@700&display=swap"
            font={isMobile ? 'bold 20px Orbitron' : 'bold 26px Orbitron'}
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
