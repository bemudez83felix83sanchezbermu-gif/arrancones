/**
 * Dominio del álbum del evento: categorías y estados de moderación.
 * Lo comparten la API (/api/album/*), el álbum público, la página de subida y el panel.
 */

export const ALBUM_FOLDER = 'carfest2k26/album';

export const ALBUM_CATEGORIES = {
  general: {
    id: 'general',
    label: 'Evento general',
    short: 'General',
    hint: 'Ambiente, gente, stands y lo que se vivió',
    color: '#E5E5E5',
  },
  arrancones: {
    id: 'arrancones',
    label: 'Arrancones',
    short: 'Arrancones',
    hint: 'Salidas, carriles y pits',
    color: '#FF2A2A',
  },
  drift: {
    id: 'drift',
    label: 'Drift',
    short: 'Drift',
    hint: 'Derrapes, humo y exhibiciones',
    color: '#8B5CF6',
  },
  oldies: {
    id: 'oldies',
    label: 'Carros oldies',
    short: 'Oldies',
    hint: 'Clásicos, lowriders y restaurados',
    color: '#C2891A',
  },
  offroad: {
    id: 'offroad',
    label: 'Off-road',
    short: 'Off-road',
    hint: 'Trocas, RZR y 4x4',
    color: '#22C55E',
  },
  carshow: {
    id: 'carshow',
    label: 'Car show',
    short: 'Car show',
    hint: 'Exhibición, tuning y autos modificados',
    color: '#3B82E8',
  },
};

export const ALBUM_CATEGORY_IDS = Object.keys(ALBUM_CATEGORIES);
export const DEFAULT_ALBUM_CATEGORY = 'general';

/** Lo que llegue en `context.category` lo escribe quien sube: todo lo desconocido cae en general. */
export const normalizeAlbumCategory = (value) =>
  ALBUM_CATEGORIES[value] ? value : DEFAULT_ALBUM_CATEGORY;

export const albumCategoryLabel = (id) => ALBUM_CATEGORIES[normalizeAlbumCategory(id)].label;

/**
 * `unmoderated` = subido con un preset sin `Moderation: Manual`. Nunca se publica
 * y Cloudinary no deja aprobarlo; solo se puede borrar.
 */
export const MODERATION_STATUSES = {
  pending: { id: 'pending', label: 'Pendiente', color: '#C2891A' },
  approved: { id: 'approved', label: 'Aprobada', color: '#22C55E' },
  rejected: { id: 'rejected', label: 'Rechazada', color: '#FF2A2A' },
  unmoderated: { id: 'unmoderated', label: 'Sin moderar', color: '#8A8A8A' },
};

/** Tope por petición de aprobación masiva; cada archivo es una llamada al Admin API. */
export const MAX_MODERATION_BATCH = 50;

export const UPLOADER_MAX = 60;

/** `context` de Cloudinary como `k=v|k=v`; `=` y `|` dentro del valor van escapados. */
export function toCloudinaryContext(entries) {
  return Object.entries(entries)
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => `${key}=${String(value).replace(/\\/g, '').replace(/([=|])/g, '\\$1')}`)
    .join('|');
}

/** El Search API devuelve el context plano; el resto del Admin API lo anida en `custom`. */
export function readAlbumContext(row) {
  const ctx = row?.context?.custom ?? row?.context ?? {};
  return {
    uploader: typeof ctx.uploader === 'string' && ctx.uploader ? ctx.uploader : null,
    category: normalizeAlbumCategory(ctx.category),
  };
}

export const isAlbumPublicId = (publicId) =>
  typeof publicId === 'string' &&
  publicId.startsWith(`${ALBUM_FOLDER}/`) &&
  !publicId.includes('..');
