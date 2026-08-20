/**
 * Convierte cualquier imagen (jpg, png, webp) a un data URL WebP,
 * redimensionando la más larga a `maxSide` para bajar peso.
 * Devuelve { dataUrl, sizeKb, width, height }.
 */
export async function imageToWebp(file, { maxSide = 1280, quality = 0.82 } = {}) {
  if (!file) throw new Error('Selecciona una imagen.');
  if (!file.type?.startsWith('image/')) {
    throw new Error('Ese archivo no es una imagen. Usa JPG, PNG o WEBP.');
  }
  if (file.type === 'image/heic' || file.type === 'image/heif') {
    throw new Error('El formato HEIC no se puede procesar en el navegador. Expórtalo como JPG y súbelo de nuevo.');
  }

  const bitmap = await loadBitmap(file);
  const { width, height } = fit(bitmap.width, bitmap.height, maxSide);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error('El navegador no pudo generar el WebP.'))),
      'image/webp',
      quality,
    );
  });

  const dataUrl = await blobToDataUrl(blob);
  return {
    dataUrl,
    sizeKb: Math.round(blob.size / 1024),
    width,
    height,
  };
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
    reader.onerror = () => reject(reader.error ?? new Error('No se pudo leer la imagen.'));
    reader.readAsDataURL(blob);
  });
}
