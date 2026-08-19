import { readdir, stat, unlink } from 'node:fs/promises';
import { extname, join } from 'node:path';
import sharp from 'sharp';

const roots = [
  new URL('../public/sponsors/', import.meta.url),
  new URL('../public/sponsors_s_fondo/', import.meta.url),
];

const removeOriginals = process.argv.includes('--remove-originals');

for (const dirUrl of roots) {
  const dir = new URL(dirUrl).pathname.replace(/^\/([A-Za-z]):/, '$1:');
  const files = await readdir(dir);
  for (const file of files) {
    const ext = extname(file).toLowerCase();
    if (!['.png', '.jpg', '.jpeg'].includes(ext)) continue;
    const input = join(dir, file);
    const output = input.replace(/\.(png|jpg|jpeg)$/i, '.webp');
    const before = (await stat(input)).size;
    await sharp(input).webp({ quality: 90 }).toFile(output);
    const after = (await stat(output)).size;
    console.log(
      `${file.padEnd(30)} ${(before / 1024).toFixed(0).padStart(4)}KB -> ${(after / 1024)
        .toFixed(0)
        .padStart(4)}KB`,
    );
    if (removeOriginals) await unlink(input);
  }
}
