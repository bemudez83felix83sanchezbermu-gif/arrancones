import { useEffect, useState } from 'react';
import { EVENT } from '../data/event';
import { openCategoryIds } from '../../shared/participants';

// Sonora no cambia de horario; el "día" del evento siempre es el de Puerto Peñasco.
const localDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Hermosillo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/**
 * En qué momento del fest estamos:
 * - `before`: antes de la salida del desfile (cuenta regresiva).
 * - `live`: del desfile al cierre del domingo; `today` es el día del programa.
 * - `after`: ya terminó.
 * `registrationOpen` es true mientras alguna categoría siga recibiendo
 * inscripciones (cada una cierra en su `closesAt`).
 */
export function getEventPhase(now = Date.now()) {
  const registrationOpen = openCategoryIds(now).length > 0;
  if (now < Date.parse(EVENT.startDate)) return { phase: 'before', today: null, registrationOpen };
  if (now > Date.parse(EVENT.endDate)) return { phase: 'after', today: null, registrationOpen };
  const iso = localDate.format(now);
  const today = EVENT.days.find((day) => day.iso === iso) ?? null;
  return { phase: 'live', today, registrationOpen };
}

/**
 * Solo en `npm run dev`: `?fase=antes|vivo|despues&dia=1..3` para revisar cada
 * estado sin esperar al evento. En producción se elimina del bundle.
 */
function devOverride() {
  if (!import.meta.env.DEV || typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const fase = params.get('fase');
  if (!fase) return null;
  const phase = { antes: 'before', vivo: 'live', despues: 'after' }[fase] ?? fase;
  const today = phase === 'live' ? EVENT.days[(Number(params.get('dia')) || 1) - 1] ?? null : null;
  return { phase, today, registrationOpen: phase !== 'after' };
}

const current = () => devOverride() ?? getEventPhase();

/** Igual que getEventPhase, pero se actualiza solo (cada 30 s) mientras la página esté abierta. */
export function useEventPhase() {
  const [state, setState] = useState(current);

  useEffect(() => {
    const id = window.setInterval(() => {
      const next = current();
      setState((prev) =>
        prev.phase === next.phase &&
        prev.today === next.today &&
        prev.registrationOpen === next.registrationOpen
          ? prev
          : next,
      );
    }, 30_000);
    return () => window.clearInterval(id);
  }, []);

  return state;
}
