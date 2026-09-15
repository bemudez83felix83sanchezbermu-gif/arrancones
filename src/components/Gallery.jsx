import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import DomeGallery from './DomeGallery';
import { GALLERY_IMAGES } from '../data/gallery';
import { listPublicParticipants } from '../lib/api';

const SEGMENTS = 18;
// DomeGallery acomoda 5 mosaicos por columna; lo que pase de ahí no se ve.
const DOME_TILES = SEGMENTS * 5;

/**
 * `vehicle_photo` llega como data URL base64. El domo repite cada foto en varios
 * mosaicos y la copia en `src` y `data-src`, así que se pasa a object URL: el DOM
 * carga una URL corta y el navegador decodifica la imagen una sola vez.
 */
function toObjectUrl(dataUrl) {
  const match = /^data:([^;,]+);base64,(.+)$/.exec(dataUrl ?? '');
  if (!match) return null;
  try {
    const binary = atob(match[2]);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return URL.createObjectURL(new Blob([bytes], { type: match[1] }));
  } catch {
    return null;
  }
}

export default function Gallery() {
  const [carImages, setCarImages] = useState([]);

  // Si el endpoint falla, el domo se queda con las fotos fijas.
  useEffect(() => {
    let alive = true;
    const created = [];
    listPublicParticipants()
      .then((participants) => {
        if (!alive) return;
        const next = [];
        for (const participant of participants) {
          const src = toObjectUrl(participant.vehicle_photo);
          if (!src) continue;
          created.push(src);
          next.push({ src, alt: `${participant.vehicle_name} — ${participant.pilot_name}` });
        }
        setCarImages(next);
      })
      .catch(() => {});
    return () => {
      alive = false;
      created.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  // Los inscritos van primero (más recientes arriba) para que ocupen el frente del domo.
  const images = useMemo(
    () => [...carImages, ...GALLERY_IMAGES].slice(0, DOME_TILES),
    [carImages],
  );

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
          images={images}
          fit={0.82}
          minRadius={360}
          maxVerticalRotationDeg={12}
          segments={SEGMENTS}
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
