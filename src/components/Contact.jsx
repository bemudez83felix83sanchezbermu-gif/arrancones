import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { FacebookIcon, InstagramIcon } from './BrandIcons';
import { EVENT, WHATSAPP_URL } from '../data/event';

export default function Contact() {
  return (
    <section
      id="contacto"
      className="relative overflow-hidden border-t border-white/5 bg-racing-smoke py-20 md:py-28"
    >
      <div className="pointer-events-none absolute inset-0 opacity-10">
        <div className="absolute -left-24 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-racing-red blur-[120px]" />
        <div className="absolute -right-24 top-0 h-96 w-96 rounded-full bg-racing-gold blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 text-center md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-racing-red">
            Informes y reservaciones
          </span>
          <h2 className="section-heading mt-3">
            No te <span className="text-racing-red">quedes fuera</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-white/70">
            Escríbenos por WhatsApp para participar, patrocinar, poner un stand o
            resolver cualquier duda del evento.
          </p>

          <a
            href={WHATSAPP_URL(
              'Hola! Quiero información sobre el Car Fest 2K26 en Puerto Peñasco.',
            )}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex items-center gap-3 border-2 border-racing-red bg-racing-red/10 px-8 py-5 text-lg font-semibold uppercase tracking-widest text-white transition hover:bg-racing-red"
            style={{ clipPath: 'polygon(4% 0, 100% 0, 96% 100%, 0 100%)' }}
          >
            <MessageCircle size={22} />
            {EVENT.contact.whatsappDisplay}
          </a>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-white/70">
            <a
              href={EVENT.contact.facebookEvent}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 border border-white/20 px-4 py-2 text-sm uppercase tracking-wider transition hover:border-racing-red hover:text-white"
            >
              <FacebookIcon size={16} />
              Evento en Facebook
            </a>
            <a
              href={EVENT.contact.instagram}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 border border-white/20 px-4 py-2 text-sm uppercase tracking-wider transition hover:border-racing-red hover:text-white"
            >
              <InstagramIcon size={16} />
              {EVENT.contact.instagramHandle}
            </a>
          </div>

          <p className="mt-8 text-xs uppercase tracking-[0.3em] text-white/40">
            ¡Es tu momento de acelerar tu marca!
          </p>
        </motion.div>
      </div>
    </section>
  );
}
