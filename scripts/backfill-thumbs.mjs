/**
 * Genera la miniatura (`vehicle_thumb`) de los inscritos que tienen foto pero
 * no miniatura: los registrados antes de que existiera o desde un navegador que
 * no la pudo preparar. Mismo tamaño que `src/lib/optimizeImage.js` (640px).
 *
 * Uso:
 *   npm run db:thumbs              → solo los que no tienen miniatura
 *   npm run db:thumbs -- --all     → regenera todas
 *   npm run db:thumbs -- --dry-run → calcula tamaños sin escribir
 */
import sharp from 'sharp';
import { getSql } from '../shared/db.js';
import { VEHICLE_THUMB_MAX_KB } from '../shared/participants.js';

const MAX_SIDE = 640;
const all = process.argv.includes('--all');
const dryRun = process.argv.includes('--dry-run');
const DATA_URL = /^data:image\/(?:webp|jpeg|png);base64,(.+)$/;

const sql = getSql();
const rows = all
  ? await sql`select id, vehicle_photo from participants where vehicle_photo is not null order by id`
  : await sql`
      select id, vehicle_photo from participants
      where vehicle_photo is not null and vehicle_thumb is null
      order by id
    `;

let before = 0;
let after = 0;
for (const row of rows) {
  const match = DATA_URL.exec(row.vehicle_photo);
  if (!match) {
    console.warn(`#${row.id}: foto con formato inesperado, se omite`);
    continue;
  }
  const input = Buffer.from(match[1], 'base64');
  let quality = 66;
  let output;
  do {
    output = await sharp(input)
      .rotate()
      .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: 'inside', withoutEnlargement: true })
      .webp({ quality })
      .toBuffer();
    quality -= 12;
  } while (output.length > VEHICLE_THUMB_MAX_KB * 1024 * 0.9 && quality > 30);

  const thumb = `data:image/webp;base64,${output.toString('base64')}`;
  before += row.vehicle_photo.length;
  after += thumb.length;
  console.log(
    `#${String(row.id).padEnd(4)} ${Math.round(row.vehicle_photo.length / 1024)} KB -> ${Math.round(thumb.length / 1024)} KB`,
  );
  // No se toca updated_at: `photo_url` ya cambia de versión cuando aparece la miniatura.
  if (!dryRun) await sql`update participants set vehicle_thumb = ${thumb} where id = ${row.id}`;
}

console.log(
  `\n${rows.length} registro(s)${dryRun ? ' (sin escribir)' : ''}: ${(before / 1048576).toFixed(2)} MB -> ${(after / 1048576).toFixed(2)} MB`,
);
