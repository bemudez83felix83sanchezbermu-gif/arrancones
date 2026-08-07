import { MessageCircle } from 'lucide-react';
import { FacebookIcon, InstagramIcon } from './BrandIcons';
import { EVENT, WHATSAPP_URL } from '../data/event';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-white/10 bg-racing-asphalt">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-3 md:px-8">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-racing-red bg-racing-asphalt">
              <span className="display text-xl text-white">A</span>
            </div>
            <span className="display text-xl tracking-widest text-white">
              CAR FEST <span className="text-racing-red">2K26</span>
            </span>
          </div>
          <p className="mt-3 text-sm text-white/60">
            Organiza <strong className="text-white">{EVENT.organizer}</strong>.<br />
            {EVENT.venue}, {EVENT.city}.
          </p>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
            Explora
          </h4>
          <ul className="mt-4 space-y-2 text-sm text-white/70">
            <li><a className="hover:text-white" href="#evento">Sobre el evento</a></li>
            <li><a className="hover:text-white" href="#categorias">Categorías</a></li>
            <li><a className="hover:text-white" href="#programa">Programa</a></li>
            <li><a className="hover:text-white" href="#ubicacion">Ubicación</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
            Contacto
          </h4>
          <div className="mt-4 flex flex-col gap-3 text-sm text-white/70">
            <a
              href={WHATSAPP_URL('Hola! Info del Car Fest 2K26 por favor.')}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 hover:text-white"
            >
              <MessageCircle size={16} className="text-racing-red" />
              {EVENT.contact.whatsappDisplay}
            </a>
            <a
              href={EVENT.contact.facebookEvent}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 hover:text-white"
            >
              <FacebookIcon size={16} className="text-racing-red" />
              Evento en Facebook
            </a>
            <a
              href={EVENT.contact.instagram}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 hover:text-white"
            >
              <InstagramIcon size={16} className="text-racing-red" />
              {EVENT.contact.instagramHandle}
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs uppercase tracking-widest text-white/40 md:flex-row md:px-8">
          <span>© {year} {EVENT.organizer} · Todos los derechos reservados</span>
          <span className="text-racing-red">{EVENT.tagline}</span>
        </div>
      </div>
    </footer>
  );
}
