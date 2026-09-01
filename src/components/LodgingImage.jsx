import { useState } from 'react';
import { ImageOff } from 'lucide-react';

// Muestra <img src="{folder}/cover.webp">. Si aún no se ha agregado la foto,
// cae en un placeholder oscuro con ícono, sin romper el layout.
export default function LodgingImage({ folder, alt, className = '', icon: Icon = ImageOff }) {
  const [failed, setFailed] = useState(false);
  const src = `${folder}/cover.webp`;

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-racing-smoke to-black text-white/25 ${className}`}
      >
        <div className="flex flex-col items-center gap-2 text-[10px] uppercase tracking-[0.25em]">
          <Icon size={26} />
          <span>Foto próximamente</span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
