/**
 * Utilidades para servir imágenes y videos de Cloudinary con transformaciones
 * on-the-fly. Se generan las URLs modificando `/upload/` con la cadena de
 * transformación. Los helpers funcionan para ambos `resource_type` (image y
 * video) — para videos, además, existen helpers para el poster/thumbnail.
 */

const UPLOAD_MARK = '/upload/';

export const cloudinaryConfig = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '',
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '',
  folder: 'carfest2k26/album',
};

export function cldTransform(url, transform) {
  if (!url || !transform) return url;
  const idx = url.indexOf(UPLOAD_MARK);
  if (idx === -1) return url;
  const head = url.slice(0, idx + UPLOAD_MARK.length);
  const tail = url.slice(idx + UPLOAD_MARK.length);
  return `${head}${transform}/${tail}`;
}

export const cldThumb = (url) => cldTransform(url, 'w_600,c_limit,q_auto,f_auto');
export const cldPreview = (url) => cldTransform(url, 'w_1600,c_limit,q_auto,f_auto');
export const cldFull = (url) => cldTransform(url, 'q_auto,f_auto');

/** True si la URL apunta a un recurso `video` en Cloudinary. */
export const isVideoUrl = (url) => typeof url === 'string' && url.includes('/video/upload/');

/**
 * Poster (JPG) para un video de Cloudinary. Toma el primer frame nítido y lo
 * sirve como imagen para grids/miniaturas.
 */
export function cldVideoPoster(url, width = 600) {
  if (!url) return url;
  const idx = url.indexOf(UPLOAD_MARK);
  if (idx === -1) return url;
  const head = url.slice(0, idx + UPLOAD_MARK.length);
  const tail = url.slice(idx + UPLOAD_MARK.length);
  const noExt = tail.replace(/\.(mp4|mov|webm|mkv|avi|m4v)$/i, '');
  return `${head}so_auto,w_${width},c_limit,q_auto,f_jpg/${noExt}.jpg`;
}

/** Fuente MP4 optimizada para la web (H.264 + AAC). */
export const cldVideoWeb = (url) => cldTransform(url, 'q_auto,f_mp4,vc_h264,ac_aac,w_1280,c_limit');

/**
 * Miniatura universal — para imágenes limita el ancho; para videos genera poster.
 */
export const cldMediaThumb = (url, width = 600) =>
  isVideoUrl(url)
    ? cldVideoPoster(url, width)
    : cldTransform(url, `w_${width},c_limit,q_auto,f_auto`);

/**
 * Duración en formato mm:ss para overlays. Acepta segundos (float) de Cloudinary.
 */
export function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds - m * 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
