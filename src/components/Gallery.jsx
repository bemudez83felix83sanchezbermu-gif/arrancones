import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import DomeGallery from './DomeGallery';
import { Link } from '../router';
import { GALLERY_IMAGES } from '../data/gallery';
import { cldTransform } from '../lib/cloudinary';
import { albumCategoryLabel } from '../../shared/album';

const SEGMENTS = 18;
// DomeGallery acomoda 5 mosaicos por columna; lo que pase de ahí no se ve.
const DOME_TILES = SEGMENTS * 5;

/** Cuadrada y recortada al sujeto: el mosaico y la vista ampliada son 1:1. */
function toDomeImage(photo) {
  const credit = photo.uploader ? ` · foto de ${photo.uploader}` : '';
  return {
    src: cldTransform(photo.url, 'w_800,h_800,c_fill,g_auto,q_auto,f_auto'),
    alt: `Car Fest 2K26 · ${albumCategoryLabel(photo.category)}${credit}`,
  };
}

export default function Gallery() {
  const [albumImages, setAlbumImages] = useState([]);

  // Solo llegan fotos aprobadas; si el álbum falla, el domo se queda con las fijas.
  // Los videos quedan fuera porque el domo solo amplía imágenes.
  useEffect(() => {
    let alive = true;
    fetch('/api/album/public')
      .then((res) => (res.ok ? res.json() : { photos: [] }))
      .then((data) => {
        if (!alive) return;
        const photos = (data.photos || []).filter((photo) => photo.resourceType !== 'video');
        setAlbumImages(photos.map(toDomeImage));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Las del álbum van primero (más recientes arriba) para que ocupen el frente del domo.
  const images = useMemo(
    () => [...albumImages, ...GALLERY_IMAGES].slice(0, DOME_TILES),
    [albumImages],
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
            {albumImages.length > 0 && ' Incluye las fotos que suben los asistentes.'}
          </p>
          {albumImages.length > 0 && (
            <Link
              to="/album"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-racing-red hover:text-white"
            >
              Ver el álbum completo
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
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
