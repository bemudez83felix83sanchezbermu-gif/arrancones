import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { WHATSAPP_URL } from '../data/event';

export default function WhatsAppFloat() {
  return (
    <motion.a
      href={WHATSAPP_URL(
        'Hola! Quiero información sobre el Car Fest 2K26 en Puerto Peñasco.',
      )}
      target="_blank"
      rel="noreferrer"
      aria-label="Contactar por WhatsApp"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1.2, type: 'spring', stiffness: 200 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_10px_40px_rgba(37,211,102,0.5)] animate-pulse-glow"
    >
      <MessageCircle size={26} strokeWidth={2.4} />
    </motion.a>
  );
}
