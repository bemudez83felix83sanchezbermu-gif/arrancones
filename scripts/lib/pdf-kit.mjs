// Utilidades compartidas por los generadores de PDF (propuesta de hospedaje,
// cobertura de Peñasco FPV): arman un HTML tamaño carta y lo imprimen con
// Chrome/Edge headless. Si el navegador no está en la ruta de siempre,
// define CHROME_PATH.

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const BROWSERS = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
];

export const esc = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );

// Íconos estilo lucide (trazo 2px) para no depender de React.
const ICONS = {
  bed: '<path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/><path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/><path d="M12 4v6"/><path d="M2 18h20"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  message: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  star: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>',
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  ship: '<path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"/><path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/><path d="M12 10v4M12 2v3"/>',
  utensils: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
  sparkles: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>',
  zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
  tag: '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r="1"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  arrow: '<path d="M5 12h14M12 5l7 7-7 7"/>',
  camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
  phone: '<rect width="14" height="20" x="5" y="2" rx="2"/><path d="M12 18h.01"/>',
  film: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18M17 3v18M3 7.5h4M3 12h18M3 16.5h4M17 7.5h4M17 16.5h4"/>',
  video: '<path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
  layers: '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
  crown: '<path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"/><path d="M5 21h14"/>',
  drone: '<circle cx="5" cy="5" r="3"/><circle cx="19" cy="5" r="3"/><circle cx="5" cy="19" r="3"/><circle cx="19" cy="19" r="3"/><path d="M7.5 7.5 10 10M16.5 7.5 14 10M7.5 16.5 10 14M16.5 16.5 14 14"/><rect x="9.5" y="9.5" width="5" height="5" rx="1.5"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  plus: '<path d="M5 12h14M12 5v14"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
};

export const icon = (name, size = 14) =>
  `<svg class="ico" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;

const dataUri = (buf, type) => `data:${type};base64,${buf.toString('base64')}`;

// Foto de /public como JPEG incrustado; null si el archivo no existe.
export async function photo(relPath, width = 1400) {
  const file = path.join(ROOT, 'public', relPath);
  if (!existsSync(file)) return null;
  const buf = await sharp(file)
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .jpeg({ quality: 84, mozjpeg: true })
    .toBuffer();
  return dataUri(buf, 'image/jpeg');
}

export const coverPhoto = (folder, width = 1400) => photo(`${folder}/cover.webp`, width);

// keepTop recorta la parte de arriba (el logo de Ingenia trae una lista de
// servicios debajo); negate vuelve blanco un logo negro para fondos oscuros.
export async function logoImage(relPath, { keepTop = 1, negate = false } = {}) {
  let buf = readFileSync(path.join(ROOT, 'public', relPath));
  if (keepTop < 1) {
    const { width, height } = await sharp(buf).metadata();
    buf = await sharp(buf)
      .extract({ left: 0, top: 0, width, height: Math.round(height * keepTop) })
      .toBuffer();
  }
  buf = await sharp(buf).trim().toBuffer();
  let img = sharp(buf);
  if (negate) img = img.negate({ alpha: false });
  buf = await img.resize({ height: 220, withoutEnlargement: true }).png().toBuffer();
  return dataUri(buf, 'image/png');
}

// Pinta un QR en cada elemento con data-qr (qr-code-styling corre en el navegador).
function qrScripts({ size = 170, accent = '#E10600' } = {}) {
  const lib = readFileSync(
    path.join(ROOT, 'node_modules', 'qr-code-styling', 'lib', 'qr-code-styling.js'),
    'utf8',
  ).replaceAll('</script', '<\\/script');
  return `<script>${lib}</script>
<script>
  const QR = window.QRCodeStyling && (window.QRCodeStyling.default || window.QRCodeStyling);
  document.querySelectorAll('[data-qr]').forEach((el) => {
    if (!QR) return;
    new QR({
      width: ${size}, height: ${size}, type: 'svg', margin: 0, data: el.dataset.qr,
      qrOptions: { errorCorrectionLevel: 'M' },
      dotsOptions: { color: '#0A0A0A', type: 'rounded' },
      cornersSquareOptions: { color: '#0A0A0A', type: 'extra-rounded' },
      cornersDotOptions: { color: '${accent}' },
      backgroundOptions: { color: '#ffffff' },
    }).append(el);
  });
</script>`;
}

export function documentShell({ title, css, body, qr }) {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;800&display=block" rel="stylesheet">
<style>${css}</style>
</head>
<body>
${body}
${qrScripts(qr)}
</body>
</html>`;
}

// Escribe el HTML de trabajo en el temp del sistema e imprime el PDF.
export function printPdf({ html, outFile, workName }) {
  const browser = BROWSERS.find((p) => p && existsSync(p));
  if (!browser) throw new Error('No encontré Chrome ni Edge. Define CHROME_PATH con la ruta del navegador.');

  const workDir = path.join(tmpdir(), workName);
  const htmlFile = path.join(workDir, 'documento.html');
  mkdirSync(workDir, { recursive: true });
  mkdirSync(path.dirname(outFile), { recursive: true });
  writeFileSync(htmlFile, html);
  rmSync(outFile, { force: true });

  const result = spawnSync(
    browser,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      `--user-data-dir=${path.join(workDir, 'profile')}`,
      '--no-pdf-header-footer',
      '--run-all-compositor-stages-before-draw',
      '--virtual-time-budget=20000',
      `--print-to-pdf=${outFile}`,
      pathToFileURL(htmlFile).href,
    ],
    { encoding: 'utf8', timeout: 120_000 },
  );

  if (!existsSync(outFile)) {
    console.error(result.error ?? result.stderr);
    throw new Error('El navegador no generó el PDF.');
  }
  return { htmlFile, kb: Math.round(statSync(outFile).size / 1024) };
}
