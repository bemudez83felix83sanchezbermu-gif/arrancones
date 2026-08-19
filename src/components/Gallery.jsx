import { motion } from 'framer-motion';
import DomeGallery from './DomeGallery';
import { GALLERY_IMAGES } from '../data/gallery';

export default function Gallery() {
  return (
    <section id="galeria" className="relative overflow-hidden bg-racing-smoke py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-racing-red">
            Galería
          </span>
          <h2 className="section-heading mt-3">
            Las <span className="text-racing-red">máquinas</span> del evento
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/70">
            Arrastra para explorar y da click en cualquier auto para verlo en
            grande.
          </p>
        </motion.div>
      </div>

      <div className="relative h-[520px] w-full sm:h-[560px] md:h-[640px]">
        <DomeGallery
          images={GALLERY_IMAGES}
          fit={0.82}
          minRadius={360}
          maxVerticalRotationDeg={12}
          segments={18}
          dragSensitivity={9}
          dragDampening={0.85}
          overlayBlurColor="#1A1A1A"
          grayscale={false}
          openedImageWidth="min(80vw, 420px)"
          openedImageHeight="min(60vh, 420px)"
        />
      </div>
    </section>
  );
}
