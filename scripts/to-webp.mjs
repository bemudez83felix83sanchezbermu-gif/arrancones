/**
 * Deja los logos de patrocinadores listos para la web: convierte PNG/JPG a
 * WebP y achica los que pasen del tamaño que de verdad se muestra.
 *
 * - `public/sponsors/` (con fondo): CircularGallery + lightbox → 1200px de lado.
 * - `public/sponsors_s_fondo/` (sin fondo): LogoLoop a 64px de alto → 480px.
 *
 * Antes de reemplazar cualquier archivo se copia el original a
 * `_originales/<carpeta>/` (en .gitignore); nunca se borra nada sin respaldo.
 * En 2026-09-20 las 27 imágenes con fondo pesaban 9.7 MB (una de 3550px).
 *
 * Uso: node scripts/to-webp.mjs [--remove-originals]
 *   --remove-originals  mueve los PNG/JPG convertidos a `_originales/`.
 */
import { copyFile, mkdir, readdir, rename, stat, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

// Sin caché, sharp suelta el archivo al terminar: en Windows el caché lo deja
// abierto y no se puede sobrescribir (EUNKNOWN al escribir el mismo WebP).
sharp.cache(false);

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const FOLDERS = [
  { name: 'sponsors', maxSide: 1200, quality: 80 },
  { name: 'sponsors_s_fondo', maxSide: 480, quality: 82 },
];
// Un WebP ya chico no se vuelve a comprimir (cada pasada pierde calidad).
const SKIP_BELOW_KB = 120;

const removeOriginals = process.argv.includes('--remove-originals');
const kb = (bytes) => `${Math.round(bytes / 1024)}KB`.padStart(6);

let totalBefore = 0;
let totalAfter = 0;

for (const folder of FOLDERS) {
  const dir = join(ROOT, 'public', folder.name);
  const backupDir = join(ROOT, '_originales', folder.name);
  await mkdir(backupDir, { recursive: true });

  for (const file of await readdir(dir)) {
    const ext = extname(file).toLowerCase();
    if (!['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) continue;
    const input = join(dir, file);
    const output = ext === '.webp' ? input : input.slice(0, -ext.length) + '.webp';
    // PNG/JPG que ya tiene su WebP: no se pisa el WebP existente.
    if (ext !== '.webp' && (await stat(output).catch(() => null))) continue;
    const before = (await stat(input)).size;
    const meta = await sharp(input).metadata();
    const oversized = Math.max(meta.width, meta.height) > folder.maxSide;

    if (ext === '.webp' && !oversized && before < SKIP_BELOW_KB * 1024) continue;

    const buffer = await sharp(input)
      .rotate()
      .resize({ width: folder.maxSide, height: folder.maxSide, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: folder.quality, alphaQuality: 90, effort: 6 })
      .toBuffer();

    // Si recomprimir un WebP no ahorra al menos 10%, se deja como estaba.
    if (ext === '.webp' && buffer.length > before * 0.9) continue;

    await copyFile(input, join(backupDir, file));
    await writeFile(output, buffer);
    if (ext !== '.webp' && removeOriginals) await rename(input, join(backupDir, file));

    totalBefore += before;
    totalAfter += buffer.length;
    console.log(`${`${folder.name}/${file}`.padEnd(48)} ${kb(before)} -> ${kb(buffer.length)}`);
  }
}

console.log(`\nTotal: ${(totalBefore / 1048576).toFixed(2)} MB -> ${(totalAfter / 1048576).toFixed(2)} MB`);
