import { esEstadoValido } from './mexico.js';

/**
 * Dominio compartido entre el formulario público, el panel y la API.
 * Cualquier regla de negocio de inscripciones vive aquí y en ningún otro lado.
 */

export const CATEGORIES = {
  drift: {
    id: 'drift',
    label: 'Drift',
    fee: 0,
    feeLabel: 'Cortesía',
    allowsCopilot: true,
    day: 'Sábado 26 de septiembre',
    tagline: 'Exhibición de derrapes',
    note: 'Los drifters no pagan inscripción.',
    color: '#F5B301',
    chart: '#C2891A',
  },
  car_show: {
    id: 'car_show',
    label: 'Car Show',
    fee: 250,
    feeLabel: '$250 MXN',
    allowsCopilot: true,
    day: 'Sábado 26 de septiembre',
    tagline: 'Exposición y premiación',
    note: 'Incluye el registro de tu auto más un copiloto gratis.',
    color: '#3B9EFF',
    chart: '#3B82E8',
  },
  arrancones: {
    id: 'arrancones',
    label: 'Arrancones',
    fee: 500,
    feeLabel: '$500 MXN',
    allowsCopilot: false,
    requiresRaceClass: true,
    day: 'Domingo 27 de septiembre',
    tagline: 'Carrera de aceleración',
    note: 'Durante las corridas solo puede ir el piloto en el auto. Tu acompañante puede entrar al evento contigo, pero no sube al vehículo cuando corras.',
    color: '#E10600',
    chart: '#E10600',
  },
};

export const CATEGORY_IDS = Object.keys(CATEGORIES);

/**
 * Clases dentro de arrancones (según flyer del evento). El id se guarda tal cual
 * en la BD; el label es para mostrar en el formulario, panel y CSV.
 */
export const ARRANCONES_CLASSES = {
  '4x4': { id: '4x4', label: '4x4' },
  '4_cil': { id: '4_cil', label: '4 cilindros libre' },
  '8_cil': { id: '8_cil', label: '8 cilindros libre' },
  bracket: { id: 'bracket', label: 'Bracket' },
};

export const ARRANCONES_CLASS_IDS = Object.keys(ARRANCONES_CLASSES);

export const raceClassLabel = (id) => ARRANCONES_CLASSES[id]?.label ?? id ?? '';

export const STATUSES = {
  pendiente: { id: 'pendiente', label: 'Pendiente', color: '#F5B301' },
  confirmado: { id: 'confirmado', label: 'Confirmado', color: '#22C55E' },
  cancelado: { id: 'cancelado', label: 'Cancelado', color: '#8A8A8A' },
};

export const STATUS_IDS = Object.keys(STATUSES);

export const categoryLabel = (id) => CATEGORIES[id]?.label ?? id;
export const categoryFee = (id) => CATEGORIES[id]?.fee ?? 0;
export const statusLabel = (id) => STATUSES[id]?.label ?? id;

/** Folio legible y estable derivado del id de la fila. */
export const folio = (id) => `CF-${String(id).padStart(4, '0')}`;

export const formatMoney = (n) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(n ?? 0);

export const normalizePhone = (v) => String(v ?? '').replace(/\D+/g, '');

export const formatPhone = (v) => {
  const d = normalizePhone(v);
  if (d.length === 10) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  if (d.length === 12 && d.startsWith('52'))
    return `+52 ${d.slice(2, 5)} ${d.slice(5, 8)} ${d.slice(8)}`;
  return v ?? '';
};

const clean = (v) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : '');

const isLink = (value) => /^https?:\/\//i.test(value ?? '');

const isValidUrl = (value) => {
  try {
    return new URL(value).hostname.includes('.');
  } catch {
    return false;
  }
};

/** Acepta @usuario o el link directo; si viene sin esquema le pone https://. */
export function normalizeSocial(value) {
  const text = clean(value);
  if (!text) return '';
  if (text.startsWith('@') || isLink(text)) return text;
  if (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(text)) return `https://${text}`;
  return text;
}

/** El enlace listo para <a href>, o null cuando el dato es solo un usuario. */
export const socialLink = (value) => (isLink(value) ? value : null);

/** Texto legible de un enlace: sin esquema ni diagonal final. */
export const socialLabel = (value) =>
  (value ?? '').replace(/^https?:\/\//i, '').replace(/\/+$/, '');

/** Peso máximo aceptado para la foto del vehículo (aprox., ya en base64). */
export const VEHICLE_PHOTO_MAX_KB = 900;

/**
 * Valida el data URL de la foto. Regresa `{ ok, error, value }`.
 * `requireValue = true` cuando el formulario público no debe permitir enviar sin foto.
 */
export function validateVehiclePhoto(input, { requireValue = false } = {}) {
  const value = typeof input === 'string' ? input.trim() : '';
  if (!value) {
    if (requireValue) return { ok: false, error: 'Sube una foto de tu vehículo.' };
    return { ok: true, value: null };
  }
  const match = /^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/=]+$/.exec(value);
  if (!match) {
    return { ok: false, error: 'No pudimos procesar esta foto. Intenta con otra.' };
  }
  // 1 char de base64 ~ 0.75 bytes; se compara contra el máximo en KB.
  const prefixLength = `data:image/${match[1]};base64,`.length;
  const approxBytes = Math.floor((value.length - prefixLength) * 0.75);
  if (approxBytes > VEHICLE_PHOTO_MAX_KB * 1024) {
    return {
      ok: false,
      error: `La foto pesa demasiado (>${VEHICLE_PHOTO_MAX_KB} KB). Súbela más chica.`,
    };
  }
  return { ok: true, value };
}

/**
 * Valida y normaliza lo que llega del formulario.
 * Devuelve { errors, value }: errors es un objeto campo -> mensaje.
 */
export function validateParticipant(input = {}, { partial = false, requirePhoto = false } = {}) {
  const errors = {};
  const value = {};
  const has = (k) => !partial || input[k] !== undefined;
  // status y notes solo los manda el panel: si no vienen, no se validan.
  const sent = (k) => input[k] !== undefined;

  if (has('category')) {
    const category = clean(input.category);
    if (!CATEGORIES[category]) errors.category = 'Selecciona una categoría válida.';
    else value.category = category;
  }

  if (has('pilot_name')) {
    const pilot = clean(input.pilot_name);
    if (pilot.length < 3) errors.pilot_name = 'Escribe el nombre completo del piloto.';
    else if (pilot.length > 80) errors.pilot_name = 'Máximo 80 caracteres.';
    else value.pilot_name = pilot;
  }

  if (has('vehicle_name')) {
    const vehicle = clean(input.vehicle_name);
    if (vehicle.length < 2) errors.vehicle_name = 'Escribe el nombre del vehículo.';
    else if (vehicle.length > 80) errors.vehicle_name = 'Máximo 80 caracteres.';
    else value.vehicle_name = vehicle;
  }

  if (has('copilot_name')) {
    const copilot = clean(input.copilot_name);
    const category = value.category ?? clean(input.category);
    if (copilot && CATEGORIES[category] && !CATEGORIES[category].allowsCopilot) {
      errors.copilot_name = 'En arrancones no se registra copiloto: durante las corridas solo puede ir el piloto en el auto.';
    } else if (copilot.length > 80) {
      errors.copilot_name = 'Máximo 80 caracteres.';
    } else {
      value.copilot_name = copilot || null;
    }
  }

  if (has('race_class') || has('category')) {
    const category = value.category ?? clean(input.category);
    const requires = CATEGORIES[category]?.requiresRaceClass;
    const raceClass = clean(input.race_class);
    if (requires) {
      if (!ARRANCONES_CLASSES[raceClass]) {
        errors.race_class = 'Elige la categoría del arrancón (4x4, 4 cil, 8 cil o bracket).';
      } else {
        value.race_class = raceClass;
      }
    } else if (has('race_class')) {
      // Fuera de arrancones no se guarda la clase.
      value.race_class = null;
    }
  }

  if (has('phone')) {
    const phone = normalizePhone(input.phone);
    if (phone.length < 10) errors.phone = 'Escribe un WhatsApp a 10 dígitos.';
    else if (phone.length > 15) errors.phone = 'Número demasiado largo.';
    else value.phone = phone;
  }

  if (has('state')) {
    const state = clean(input.state);
    if (!esEstadoValido(state)) errors.state = 'Selecciona tu estado.';
    else value.state = state;
  }

  if (has('city')) {
    const city = clean(input.city);
    if (city.length < 3) errors.city = 'Selecciona o escribe tu municipio.';
    else if (city.length > 60) errors.city = 'Máximo 60 caracteres.';
    else value.city = city;
  }

  if (has('social')) {
    const social = normalizeSocial(input.social);
    if (!social) value.social = null;
    else if (social.length > 200) errors.social = 'Máximo 200 caracteres.';
    else if (isLink(social) && !isValidUrl(social)) errors.social = 'Ese enlace no es válido.';
    else value.social = social;
  }

  if (has('vehicle_photo') || requirePhoto) {
    const check = validateVehiclePhoto(input.vehicle_photo, { requireValue: requirePhoto });
    if (!check.ok) errors.vehicle_photo = check.error;
    else if (check.value !== undefined) value.vehicle_photo = check.value;
  }

  if (sent('status')) {
    const status = clean(input.status);
    if (!STATUSES[status]) errors.status = 'Estado inválido.';
    else value.status = status;
  }

  if (sent('notes')) {
    const notes = typeof input.notes === 'string' ? input.notes.trim() : '';
    if (notes.length > 500) errors.notes = 'Máximo 500 caracteres.';
    else value.notes = notes || null;
  }

  return { errors, value, ok: Object.keys(errors).length === 0 };
}
