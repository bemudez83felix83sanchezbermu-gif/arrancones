import { VEHICLE_PHOTO_MAX_KB } from '../../shared/participants.js';

/**
 * Intentos de codificación, del mejor al más comprimido. Se usa el primero
 * que quepa en el presupuesto de peso.
 */
const ATTEMPTS = [
  { maxSide: 1280, quality: 0.82 },
  { maxSide: 1280, quality: 0.68 },
  { maxSide: 1024, quality: 0.6 },
  { maxSide: 800, quality: 0.5 },
];

const ALLOWED = /^data:image\/(webp|jpeg|png);base64,/;

/**
 * Único mensaje que ve el usuario: nadie que se inscribe sabe qué es un WebP
 * ni un canvas. El motivo técnico va en `cause` y a la consola, para nosotros.
 */
const USER_MESSAGE = 'No pudimos preparar esta foto. Intenta con otra.';

function photoError(detail) {
  console.warn('[foto]', detail);
  return new Error(USER_MESSAGE, { cause: detail });
}

/**
 * Optimiza una imagen en el navegador y devuelve un data URL listo para enviar.
 * Prefiere WebP, pero cae a JPEG en navegadores que no saben codificarlo
 * (Safari viejo y varios webviews dentro de apps), porque `canvas.toBlob`
 * regresa PNG en silencio cuando el formato pedido no existe.
 *
 * Devuelve { dataUrl, mime, sizeKb, width, height }.
 */
export async function optimizeImage(file, { maxKb = VEHICLE_PHOTO_MAX_KB } = {}) {
  if (!file) throw photoError('sin archivo');
  // Algunos selectores móviles entregan el archivo sin `type`; solo se
  // rechaza cuando sí viene y no es imagen.
  if (file.type && !file.type.startsWith('image/')) {
    throw new Error('Ese archivo no es una foto. Elige una imagen de tu galería.');
  }

  const bitmap = await loadBitmap(file);
  try {
    const mime = encoderMime();
    const budget = Math.floor(maxKb * 1024 * 0.9);
    let best = null;
    for (const attempt of ATTEMPTS) {
      best = await encode(bitmap, mime, attempt);
      if (best.blob.size <= budget) break;
    }
    if (best.blob.size > maxKb * 1024) {
      throw photoError(`no bajó del límite: ${Math.round(best.blob.size / 1024)} KB > ${maxKb} KB`);
    }

    const dataUrl = await blobToDataUrl(best.blob);
    if (!ALLOWED.test(dataUrl)) {
      throw photoError(`formato inesperado: ${dataUrl.slice(0, 30)}`);
    }
    return {
      dataUrl,
      mime: dataUrl.slice(5, dataUrl.indexOf(';')),
      sizeKb: Math.round(best.blob.size / 1024),
      width: best.width,
      height: best.height,
    };
  } finally {
    bitmap.close?.();
  }
}

/** WebP si el navegador lo sabe codificar; si no, JPEG. */
function encoderMime() {
  const probe = document.createElement('canvas');
  probe.width = 1;
  probe.height = 1;
  try {
    return probe.toDataURL('image/webp').startsWith('data:image/webp') ? 'image/webp' : 'image/jpeg';
  } catch {
    return 'image/jpeg';
  }
}

async function encode(bitmap, mime, { maxSide, quality }) {
  const { width, height } = fit(bitmap.width ?? bitmap.naturalWidth, bitmap.height ?? bitmap.naturalHeight, maxSide);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  // El JPEG no tiene transparencia: se rellena para que no salga en negro.
  if (mime === 'image/jpeg') {
    ctx.fillStyle = '#0b0b0c';
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(photoError('toBlob devolvió null'))),
      mime,
      quality,
    );
  });
  return { blob, width, height };
}

async function loadBitmap(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file);
    } catch {
      // Cae al <img> como respaldo.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return img;
  } catch (err) {
    throw photoError(`no se pudo decodificar (${file.type || 'sin tipo'}): ${err?.message ?? err}`);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function fit(w, h, maxSide) {
  if (w <= maxSide && h <= maxSide) return { width: w, height: h };
  const ratio = w > h ? maxSide / w : maxSide / h;
  return { width: Math.round(w * ratio), height: Math.round(h * ratio) };
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(photoError(reader.error?.message ?? 'FileReader falló'));
    reader.readAsDataURL(blob);
  });
}
