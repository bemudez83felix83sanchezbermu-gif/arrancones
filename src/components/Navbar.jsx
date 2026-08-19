import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Menu, X } from 'lucide-react';
import { Link } from '../router';

const links = [
  { href: '#evento', label: 'Evento' },
  { href: '#categorias', label: 'Categorías' },
  { href: '#programa', label: 'Programa' },
  { href: '#galeria', label: 'Galería' },
  { href: '#ubicacion', label: 'Ubicación' },
  { href: '#contacto', label: 'Contacto' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

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
            to="/registro"
            className="inline-flex items-center gap-2 bg-racing-red px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:brightness-110"
            style={{ clipPath: 'polygon(8% 0, 100% 0, 92% 100%, 0 100%)' }}
          >
            <ClipboardList size={15} /> Inscríbete
          </Link>
        </nav>

        <div className="flex items-center gap-3 md:hidden">
          <Link
            to="/registro"
            className="bg-racing-red px-4 py-2 text-xs font-bold uppercase tracking-wider text-white"
            style={{ clipPath: 'polygon(8% 0, 100% 0, 92% 100%, 0 100%)' }}
          >
            Inscríbete
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
              to="/registro"
              onClick={() => setOpen(false)}
              className="mt-4 flex items-center justify-center gap-2 bg-racing-red py-3 text-sm font-bold uppercase tracking-wider text-white"
            >
              <ClipboardList size={16} /> Inscribir mi vehículo
            </Link>
          </div>
        </motion.nav>
      )}
    </motion.header>
  );
}
