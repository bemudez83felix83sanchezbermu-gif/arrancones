import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BedDouble, ClipboardList, Images, Menu, X } from 'lucide-react';
import { Link } from '../router';
import { useEventPhase } from '../lib/eventPhase';

const links = [
  { href: '#evento', label: 'Evento' },
  { href: '#programa', label: 'Programa' },
  { href: '#categorias', label: 'Categorías' },
  { href: '#galeria', label: 'Galería' },
  { href: '#ubicacion', label: 'Ubicación' },
  { href: '#contacto', label: 'Contacto' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  // Al cerrar inscripciones el botón rojo del menú lleva al álbum.
  const { registrationOpen } = useEventPhase();
  const cta = registrationOpen
    ? { to: '/registro', label: 'Inscríbete', long: 'Inscribir mi vehículo', icon: ClipboardList }
    : { to: '/album', label: 'Ver álbum', long: 'Ver álbum del evento', icon: Images };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-racing-asphalt/85 backdrop-blur-md border-b border-white/10'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
        <a href="#top" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-racing-red bg-racing-asphalt">
            <span className="display text-xl text-white">A</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="display text-lg tracking-widest text-white">
              CAR FEST <span className="text-racing-red">2K26</span>
            </span>
            <span className="text-[10px] uppercase tracking-[0.3em] text-white/50">
              ALP Racing
            </span>
          </div>
        </a>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium uppercase tracking-wider text-white/70 transition hover:text-white"
            >
              {l.label}
            </a>
          ))}

          <Link
            to="/album"
            className="group inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-white/80 transition hover:text-white"
            aria-label="Álbum público del evento"
          >
            <Images size={15} />
            Álbum
            <span className="relative ml-1 flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-racing-red opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-racing-red" />
            </span>
          </Link>

          <Link
            to="/hospedaje"
            className="inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-racing-gold transition hover:brightness-110"
          >
            <BedDouble size={15} /> Hospedaje
          </Link>

          <Link
            to={cta.to}
            className="inline-flex items-center gap-2 bg-racing-red px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:brightness-110"
            style={{ clipPath: 'polygon(8% 0, 100% 0, 92% 100%, 0 100%)' }}
          >
            <cta.icon size={15} /> {cta.label}
          </Link>
        </nav>

        <div className="flex items-center gap-3 md:hidden">
          <Link
            to={cta.to}
            className="bg-racing-red px-4 py-2 text-xs font-bold uppercase tracking-wider text-white"
            style={{ clipPath: 'polygon(8% 0, 100% 0, 92% 100%, 0 100%)' }}
          >
            {cta.label}
          </Link>
          <button
            className="text-white"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menú"
          >
            {open ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {open && (
        <motion.nav
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-white/10 bg-racing-asphalt md:hidden"
        >
          <div className="flex flex-col p-4">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="border-b border-white/5 py-3 text-sm font-medium uppercase tracking-wider text-white/80"
              >
                {l.label}
              </a>
            ))}

            <Link
              to="/album"
              onClick={() => setOpen(false)}
              className="mt-4 flex items-center justify-center gap-2 rounded-full border border-white/25 py-3 text-sm font-bold uppercase tracking-wider text-white"
            >
              <Images size={16} /> Álbum del evento
              <span className="relative ml-1 flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-racing-red opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-racing-red" />
              </span>
            </Link>

            <Link
              to="/hospedaje"
              onClick={() => setOpen(false)}
              className="mt-3 flex items-center justify-center gap-2 rounded-full border border-racing-gold/50 py-3 text-sm font-bold uppercase tracking-wider text-racing-gold"
            >
              <BedDouble size={16} /> Hospedaje y viajes
            </Link>

            <Link
              to={cta.to}
              onClick={() => setOpen(false)}
              className="mt-3 flex items-center justify-center gap-2 bg-racing-red py-3 text-sm font-bold uppercase tracking-wider text-white"
            >
              <cta.icon size={16} /> {cta.long}
            </Link>
          </div>
        </motion.nav>
      )}
    </motion.header>
  );
}
