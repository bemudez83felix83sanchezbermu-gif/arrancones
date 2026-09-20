// Genera el PDF de cobertura de video y foto de Peñasco FPV para pilotos.
//
//   npm run fpv:pdf
//
// Lee paquetes, extras y combinaciones de src/data/fpv.js y deja el resultado
// en public/propuesta/CarFest2K26-Cobertura-PenascoFPV.pdf. Se aparta por el
// WhatsApp de reservaciones de la agencia.

import path from 'node:path';
import { ROOT, documentShell, esc, icon, logoImage, photo, printPdf } from './lib/pdf-kit.mjs';
import { EVENT } from '../src/data/event.js';
import { RESERVATIONS_WHATSAPP_DISPLAY, whatsappLink } from '../src/data/lodging.js';
import {
  FPV,
  FPV_PROPOSAL_PDF,
  comboTotal,
  fpvCombos,
  fpvExtras,
  fpvPackages,
} from '../src/data/fpv.js';

const OUT_FILE = path.join(ROOT, 'public', FPV_PROPOSAL_PDF);

// Fotos del evento como ambientación (no son trabajo de Peñasco FPV).
// Reemplazar por su material real cuando lo manden, con rutas dentro de /public.
const PHOTOS = {
  cover: 'participantes/camaro_verde.webp',
  drift: 'participantes/mitsu.webp',
  smoke: 'participantes/nissan_drift.webp',
};

const mxn = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
});
const money = (amount) => mxn.format(amount);

const byId = (list, id) => list.find((item) => item.id === id);
const startingPrice = Math.min(...fpvPackages.map((p) => p.price));

// Crudo + Editado cuesta menos que comprar ambos paquetes por separado.
const bundleSaving =
  byId(fpvPackages, 'crudo').price + byId(fpvPackages, 'editado').price - byId(fpvPackages, 'crudo-editado').price;

// Premium ya trae tomas con dron/FPV; el resto las puede sumar como extra.
const EXTRAS_INCLUDED = { premium: ['dron'] };

// Solo lo que cada paquete dice explícitamente; si cambian los includes en
// fpv.js, revisar esta tabla.
const COMPARE_ROWS = [
  ['Tomas en crudo', { crudo: true, 'crudo-editado': true, premium: true }],
  ['Video editado', { editado: '45–60 s', 'crudo-editado': '45–60 s', premium: '60–90 s' }],
  [
    'Edición',
    {
      crudo: 'Sin edición',
      editado: 'Dinámica, música, color y efectos',
      'crudo-editado': 'Dinámica, música y efectos',
      premium: 'Premium',
    },
  ],
  [
    'Formato',
    {
      crudo: 'Original en alta calidad',
      editado: 'Vertical',
      'crudo-editado': 'Vertical y horizontal',
      premium: 'Vertical + horizontal',
    },
  ],
  ['Seguimiento durante todo el evento', { premium: true }],
  ['Entrega digital (Drive o WeTransfer)', { crudo: true, editado: true, 'crudo-editado': true, premium: true }],
];

const GENERAL_WHATSAPP = whatsappLink(
  'Hola, quiero apartar mi cobertura con Peñasco FPV para el Car Fest 2K26.',
);
const TEAM_WHATSAPP = whatsappLink(
  `Hola, somos un equipo de ${FPV.teamMinPilots} pilotos o más y queremos cotizar cobertura con Peñasco FPV para el Car Fest 2K26.`,
);
const packageLink = (pkg) =>
  whatsappLink(
    `Hola, me interesa el paquete ${pkg.name} (${money(pkg.price)}) de Peñasco FPV para el Car Fest 2K26.`,
  );

async function loadAssets() {
  const photos = {};
  for (const [key, rel] of Object.entries(PHOTOS)) {
    photos[key] = await photo(rel, 1600);
  }
  return {
    photos,
    logos: {
      fpvWhite: await logoImage('sponsors_s_fondo/penasco_fpv.webp', { negate: true }),
      fpv: await logoImage('sponsors_s_fondo/penasco_fpv.webp'),
      penascoTours: await logoImage('sponsors_s_fondo/penasco_tours.webp'),
      ingenia: await logoImage('sponsors_s_fondo/ingenia_ds.webp', { keepTop: 0.55 }),
      alp: await logoImage('sponsors_s_fondo/ALP.WEBP'),
    },
  };
}

// ---------- piezas ----------

const logoRow = (assets, keys) =>
  `<div class="logos">${keys
    .map((k) => `<div class="logo-box logo-${k}"><img src="${assets.logos[k]}" alt=""></div>`)
    .join('')}</div>`;

const heading = (eyebrow, title, lead = '') => `<div class="heading">
  <span class="eyebrow">${esc(eyebrow)}</span>
  <h2 class="display slant">${title}</h2>
  ${lead ? `<p class="lead">${esc(lead)}</p>` : ''}
</div>`;

// Logo de FPV arriba a la derecha de cada página interior y en el pie.
const footer = (n, total, assets) => `<img class="page-logo" src="${assets.logos.fpvWhite}" alt="Peñasco FPV">
<footer class="footer">
  <span class="foot-brand"><img src="${assets.logos.fpvWhite}" alt="">Peñasco FPV · Cobertura Car Fest 2K26</span>
  <span><b>${String(n).padStart(2, '0')}</b> / ${String(total).padStart(2, '0')}</span>
</footer>`;

const amount = (value, prefix = '') =>
  `<span class="amount display">${prefix}${esc(money(value))}<small>MXN</small></span>`;

const checks = (items) =>
  `<ul class="checks">${items.map((t) => `<li>${icon('check', 12)}<span>${esc(t)}</span></li>`).join('')}</ul>`;

// ---------- páginas ----------

function coverPage(assets) {
  return `<section class="page cover">
  <div class="cover-photo">${assets.photos.cover ? `<img src="${assets.photos.cover}" alt="">` : ''}</div>
  <div class="cover-shade"></div>
  <header class="cover-top">
    <img class="cover-logo" src="${assets.logos.fpvWhite}" alt="Peñasco FPV">
    <div class="cover-tags">
      <span class="tag-glass">Cobertura personalizada</span>
      <span class="services">${FPV.services.map(esc).join(' · ')}</span>
    </div>
  </header>
  <div class="cover-body">
    <span class="chip-red">${icon('video', 12)} ${esc(EVENT.name)} · Video profesional para pilotos</span>
    <h1 class="display slant">Capturamos<br><span class="red">tu pasión</span></h1>
    <p class="cover-lead">Videos profesionales creados especialmente para pilotos, con un enfoque en tu desempeño dentro y fuera de la pista.</p>
    <div class="facts">
      <span class="fact">${icon('tag')} Desde ${esc(money(startingPrice))} MXN</span>
      <span class="fact">${icon('drone')} Tomas con dron y FPV</span>
      <span class="fact">${icon('clock')} Entrega de ${esc(FPV.delivery)}</span>
    </div>
  </div>
  <div class="stripes"></div>
  <footer class="cover-bottom">
    <div class="partners">
      <div>
        <div class="by">Cobertura por</div>
        ${logoRow(assets, ['fpv'])}
      </div>
      <span class="sep"></span>
      <div>
        <div class="by">Reservaciones a cargo de</div>
        ${logoRow(assets, ['penascoTours', 'ingenia'])}
      </div>
    </div>
    <div class="updated"><b>${esc(EVENT.displayDate)}</b><br>${esc(EVENT.city)}</div>
  </footer>
</section>`;
}

function howPage(assets) {
  const steps = [
    ['film', 'Elige tu paquete base', `Crudo, editado, los dos juntos o premium. Desde ${money(startingPrice)}.`],
    ['plus', 'Súmale extras', 'Tomas con dron o FPV, fotografías o un reel extra para tus redes.'],
    ['wallet', `Aparta con ${money(FPV.deposit)}`, 'Escríbenos por WhatsApp y asegura tu cobertura para el evento.'],
  ]
    .map(
      ([ico, title, text], i) => `<div class="step">
      <span class="num display">0${i + 1}</span>
      <div class="step-ico">${icon(ico, 18)}</div>
      <h4>${esc(title)}</h4>
      <p>${esc(text)}</p>
    </div>`,
    )
    .join('');

  // El ejemplo que dio Peñasco FPV: Video Editado + dron + reel.
  const { base, extras, total } = comboTotal(byId(fpvCombos, 'aire'));
  const tiles = [base, ...extras]
    .map(
      (item, i) => `${i ? '<span class="op display">+</span>' : ''}<div class="ex-tile">
        <span class="ex-ico">${icon(item.icon, 18)}</span>
        <b>${esc(item.name)}</b>
        <span class="display">${esc(money(item.price))}</span>
      </div>`,
    )
    .join('');

  const benefits = [
    ['target', 'Enfoque en el piloto', 'Tu desempeño dentro y fuera de la pista.'],
    ['video', 'Tu auto, tu historia', 'En alta calidad y listo para compartir.'],
    ['clock', 'Entrega rápida', `De ${FPV.delivery}, por Drive o WeTransfer.`],
    ['heart', 'Talento local', 'Apoyas un proyecto 100% de la región.'],
  ]
    .map(
      ([ico, title, text]) => `<div class="benefit">
      <div class="benefit-ico">${icon(ico, 17)}</div>
      <div><h4>${esc(title)}</h4><p>${esc(text)}</p></div>
    </div>`,
    )
    .join('');

  const strip = [assets.photos.drift, assets.photos.smoke]
    .filter(Boolean)
    .map((src) => `<img src="${src}" alt="">`)
    .join('');

  return `<section class="page glow"><div class="content">
  ${heading(
    'Cómo funciona',
    'Tu cobertura, <span class="red">a tu medida</span>',
    'Elige tu paquete base y, si quieres algo más personalizado, súmale extras. Así hacemos contenido específico para cada carro y cada piloto.',
  )}
  <div class="steps">${steps}</div>

  <div class="builder">
    <span class="k">Ejemplo</span>
    <div class="ex-row">
      ${tiles}
      <span class="op display">=</span>
      <div class="ex-total"><b>Tu cobertura</b><span class="display">${esc(money(total))}</span></div>
    </div>
    <p class="builder-note">“Quiero el Video Editado, unas tomas específicas con el dron y otro reel para mis redes.”</p>
  </div>

  <h3 class="subhead display slant">¿Por qué Peñasco FPV?</h3>
  <div class="benefits">${benefits}</div>

  <div class="strip">${strip}</div>
</div></section>`;
}

function packageCard(pkg) {
  const best = pkg.id === 'crudo-editado' && bundleSaving > 0;
  return `<article class="pkg tone-${pkg.tone} ${pkg.featured ? 'featured' : ''}">
    <header class="pkg-head">
      <div class="pkg-ico">${icon(pkg.icon, 22)}</div>
      <div>
        <h3 class="display slant">${esc(pkg.name)}</h3>
        <span class="pkg-tagline">${esc(pkg.tagline)}</span>
      </div>
    </header>
    ${best ? `<div class="best">${icon('star', 11)} Mejor valor: ahorras ${esc(money(bundleSaving))} vs. comprar Crudo y Editado por separado</div>` : ''}
    ${checks(pkg.includes)}
    <footer class="pkg-price">
      ${amount(pkg.price)}
      <a class="btn btn-light" href="${packageLink(pkg)}">Apartar ${icon('arrow', 11)}</a>
    </footer>
  </article>`;
}

function packagesPage() {
  return `<section class="page glow"><div class="content">
  ${heading(
    'Paquetes base',
    'Elige cómo <span class="red">quieres verte</span>',
    'Cuatro opciones para cubrir tu participación en el Car Fest 2K26. Todas se entregan en digital.',
  )}
  <div class="pkgs">${fpvPackages.map(packageCard).join('')}</div>
</div></section>`;
}

function compareCell(value, tone) {
  if (value === true) return `<td class="tone-${tone}">${icon('check', 15)}</td>`;
  if (!value) return '<td class="none">—</td>';
  return `<td>${esc(value)}</td>`;
}

function comparePage() {
  const head = fpvPackages
    .map(
      (p) => `<th class="pkg-th tone-${p.tone}">
        <span class="display slant">${esc(p.name)}</span>
        <span class="th-price">${esc(money(p.price))} MXN</span>
      </th>`,
    )
    .join('');

  const included = COMPARE_ROWS.map(
    ([label, values]) =>
      `<tr><td class="feature">${esc(label)}</td>${fpvPackages.map((p) => compareCell(values[p.id], p.tone)).join('')}</tr>`,
  ).join('');

  const extras = fpvExtras
    .map(
      (x) => `<tr><td class="feature">${esc(x.name)}</td>${fpvPackages
        .map((p) =>
          EXTRAS_INCLUDED[p.id]?.includes(x.id)
            ? `<td class="tone-${p.tone}">${icon('check', 15)}<span class="cell-sub">Incluidas*</span></td>`
            : `<td><span class="extra-price">+${esc(money(x.price))}</span></td>`,
        )
        .join('')}</tr>`,
    )
    .join('');

  return `<section class="page glow"><div class="content">
  ${heading(
    'Compara',
    'Todos los paquetes <span class="red">lado a lado</span>',
    'Qué trae cada paquete y cuánto cuesta sumarle extras.',
  )}
  <table class="compare">
    <colgroup><col class="feature-col"><col><col><col><col></colgroup>
    <thead><tr><th class="feature-h">Paquete</th>${head}</tr></thead>
    <tbody>
      <tr class="section"><td colspan="5">Qué incluye</td></tr>
      ${included}
      <tr class="section"><td colspan="5">Extras · se suman a cualquier paquete</td></tr>
      ${extras}
    </tbody>
  </table>
  <p class="foot-note">${icon('info', 12)} *Tomas con dron o FPV siempre que las condiciones y reglas del evento lo permitan.</p>

  <div class="callout">
    <div>
      <h4 class="display slant">¿Vienen en equipo?</h4>
      <p>Equipos de ${FPV.teamMinPilots} pilotos o más tienen descuento. Consulta precios por WhatsApp.</p>
    </div>
    <a class="btn btn-red" href="${TEAM_WHATSAPP}">${icon('users', 13)} Cotizar equipo</a>
  </div>
</div></section>`;
}

function extrasPage(assets) {
  const cards = fpvExtras
    .map(
      (x) => `<article class="extra">
      <div class="extra-ico">${icon(x.icon, 26)}</div>
      <h3 class="display slant">${esc(x.name)}</h3>
      ${amount(x.price, '+')}
      <p>${esc(x.summary)}</p>
      ${checks(x.details)}
      ${x.note ? `<p class="extra-note">${icon('info', 11)}<span>${esc(x.note)}</span></p>` : ''}
    </article>`,
    )
    .join('');

  const combos = fpvCombos
    .map((combo) => {
      const { base, extras, total } = comboTotal(combo);
      const lines = [base, ...extras]
        .map((item, i) => `<li><span>${i ? '+ ' : ''}${esc(item.name)}</span><b>${esc(money(item.price))}</b></li>`)
        .join('');
      return `<article class="combo">
        <span class="k">${esc(combo.name)}</span>
        <ul>${lines}</ul>
        <div class="combo-total"><span>Total</span><span class="display">${esc(money(total))}</span></div>
      </article>`;
    })
    .join('');

  return `<section class="page glow"><div class="content">
  ${heading(
    'Extras opcionales',
    'Súmale lo que <span class="red">tú quieras</span>',
    'Se agregan a cualquier paquete base para tener contenido más específico de tu carro y de ti como piloto.',
  )}
  <div class="banner">
    ${assets.photos.drift ? `<img src="${assets.photos.drift}" alt="">` : ''}
    <div class="banner-text display slant">Tu carro,<br><span class="red">desde todos los ángulos</span></div>
  </div>
  <div class="extras">${cards}</div>

  <h3 class="subhead display slant">Ejemplos para armar tu cobertura</h3>
  <div class="combos">${combos}</div>
</div></section>`;
}

function reservePage(assets) {
  const tiles = [
    ['wallet', 'Anticipo', `${money(FPV.deposit)} MXN para apartar`],
    ['users', 'Equipos', `${FPV.teamMinPilots} pilotos o más: consulta precios`],
    ['clock', 'Entrega', `De ${FPV.delivery}`],
    ['heart', 'Talento local', 'Un proyecto 100% de la región'],
  ]
    .map(
      ([ico, title, text]) => `<div class="tile">
      ${icon(ico, 18)}
      <b>${esc(title)}</b>
      <span>${esc(text)}</span>
    </div>`,
    )
    .join('');

  const terms = [
    `Aparta tu cobertura con un anticipo de ${money(FPV.deposit)} MXN por WhatsApp.`,
    'Tomas en pista y pits según las condiciones del evento.',
    'Tomas con dron o FPV sujetas a las condiciones y reglas del evento.',
    `Entrega digital por Drive o WeTransfer, de ${FPV.delivery}.`,
    `Equipos de ${FPV.teamMinPilots} pilotos o más: consulta precios.`,
    'Precios en pesos mexicanos (MXN).',
  ]
    .map((t) => `<li>${icon('check', 12)}<span>${esc(t)}</span></li>`)
    .join('');

  return `<section class="page glow"><div class="content">
  ${heading('Aparta tu cobertura', 'Asegura tu lugar <span class="red">con ' + esc(money(FPV.deposit)) + '</span>')}

  <div class="wa">
    <div>
      <span class="k">Aparta por WhatsApp</span>
      <div class="wa-number display">${esc(RESERVATIONS_WHATSAPP_DISPLAY)}</div>
      <p>Escanea el código o toca el botón y dinos qué paquete y qué extras quieres.</p>
      <div class="wa-actions">
        <a class="btn btn-light" href="${GENERAL_WHATSAPP}">${icon('message', 13)} Apartar mi cobertura</a>
        <a class="link-light" href="${TEAM_WHATSAPP}">¿Vienen en equipo? Cotiza aquí</a>
      </div>
    </div>
    <div class="qr" data-qr="${esc(GENERAL_WHATSAPP)}"></div>
  </div>

  <div class="tiles">${tiles}</div>

  <div class="terms">
    <h3 class="display slant">Condiciones</h3>
    <ul>${terms}</ul>
  </div>

  <div class="closing">
    <div>
      <div class="by">Cobertura por</div>
      <div class="brand-row">
        ${logoRow(assets, ['fpv'])}
        <div class="social"><b>${esc(FPV.handle)}</b><br>${FPV.socials.map(esc).join(' · ')}</div>
      </div>
    </div>
    <div>
      <div class="by">Reservaciones a cargo de</div>
      ${logoRow(assets, ['penascoTours', 'ingenia'])}
    </div>
    <div>
      <div class="by">Evento</div>
      ${logoRow(assets, ['alp'])}
    </div>
  </div>
</div></section>`;
}

// ---------- documento ----------

const CSS = `
@page { size: 8.5in 11in; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
:root {
  --red: #E10600; --red-soft: rgba(225,6,0,.15); --steel: #6B7480; --navy: #2F5D93; --gold: #B8892A;
  --ink: #0B0C0E; --panel: #15171A; --line: rgba(255,255,255,.09); --muted: rgba(255,255,255,.68); --faint: rgba(255,255,255,.42);
}
.tone-steel { --tone: var(--steel); --tone-light: #B4BCC7; } .tone-navy { --tone: var(--navy); --tone-light: #86AEE0; }
.tone-red { --tone: var(--red); --tone-light: #FF5A54; } .tone-gold { --tone: var(--gold); --tone-light: #E9BE55; }
html, body { background: var(--ink); }
body { font-family: 'Inter', system-ui, sans-serif; color: #fff; font-size: 11px; line-height: 1.45; }
a { color: inherit; text-decoration: none; }
.display { font-family: 'Bebas Neue', Impact, sans-serif; font-weight: 400; line-height: .95; letter-spacing: .01em; }
.slant { display: inline-block; transform: skewX(-7deg); }
.red { color: var(--red); }
.ico { display: inline-block; flex: none; vertical-align: -2px; }

.page { position: relative; width: 8.5in; height: 11in; overflow: hidden; background: var(--ink); break-after: page; }
.page:last-child { break-after: auto; }
.page.glow::before { content: ''; position: absolute; inset: 0;
  background: radial-gradient(circle at 100% 0%, rgba(225,6,0,.17), transparent 40%),
              radial-gradient(circle at 0% 32%, rgba(47,93,147,.13), transparent 42%),
              radial-gradient(circle at 60% 115%, rgba(225,6,0,.10), transparent 50%); }
.page.glow::after { content: ''; position: absolute; top: .66in; right: calc(.55in + 76px); width: 58px; height: 24px; opacity: .85;
  background: repeating-linear-gradient(115deg, var(--red) 0 7px, transparent 7px 15px); }
.content { position: absolute; top: .55in; left: .55in; right: .55in; bottom: .8in; display: flex; flex-direction: column; }
.footer { position: absolute; left: .55in; right: .55in; bottom: .3in; display: flex; justify-content: space-between; align-items: center; padding-top: 8px;
  border-top: 1px solid var(--line); font-size: 8.5px; font-weight: 600; letter-spacing: .22em; text-transform: uppercase; color: var(--faint); }
.footer b { color: var(--red); }
.foot-brand { display: inline-flex; align-items: center; gap: 8px; }
.foot-brand img { height: 24px; width: auto; opacity: .8; }
.page-logo { position: absolute; z-index: 2; top: .46in; right: .55in; height: 64px; width: auto; }

.eyebrow { font-size: 10px; font-weight: 700; letter-spacing: .3em; text-transform: uppercase; color: var(--red); }
.heading h2 { display: block; font-size: 50px; margin-top: 6px; transform-origin: left; }
.lead { margin-top: 8px; max-width: 5.8in; font-size: 12.5px; color: var(--muted); }
.subhead { font-size: 24px; margin-top: 20px; transform-origin: left; }
.k { display: block; font-size: 8.5px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; color: var(--faint); }
.btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 999px; font-size: 9.5px; font-weight: 800;
  letter-spacing: .12em; text-transform: uppercase; white-space: nowrap; }
.btn-red { background: var(--red); color: #fff; }
.btn-light { background: #fff; color: var(--ink); }
.amount { font-size: 36px; line-height: 1; white-space: nowrap; }
.amount small { margin-left: 4px; font-family: 'Inter', system-ui, sans-serif; font-size: 10px; font-weight: 700; letter-spacing: .1em; opacity: .75; }
.checks { list-style: none; display: grid; gap: 5px; }
.checks li { display: flex; gap: 7px; font-size: 10.5px; line-height: 1.35; color: rgba(255,255,255,.86); }
.checks .ico { color: var(--red); margin-top: 1px; }

/* logos */
.by { margin-bottom: 8px; font-size: 8.5px; font-weight: 700; letter-spacing: .25em; text-transform: uppercase; color: var(--faint); }
.logos { display: flex; gap: 10px; }
.logo-box { height: 60px; padding: 7px 14px; border-radius: 12px; background: #fff; display: flex; align-items: center; }
.partners { display: flex; align-items: flex-end; gap: 16px; }
.partners .sep { width: 1px; height: 60px; background: var(--line); }
.logo-box img { height: 100%; width: auto; display: block; }
.logo-box.logo-penascoTours, .logo-box.logo-fpv { padding: 3px 12px; }
.logo-box.logo-ingenia img { height: 62%; }

/* portada */
.cover-photo { position: absolute; top: 0; left: 0; right: 0; height: 7.3in; }
.cover-photo img { width: 100%; height: 100%; object-fit: cover; object-position: center 55%; }
.cover-shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(11,12,14,.88) 0%, rgba(11,12,14,.2) 17%,
  rgba(11,12,14,0) 32%, rgba(11,12,14,.72) 52%, #0B0C0E 66%); }
.cover-top { position: absolute; top: .45in; left: .55in; right: .55in; display: flex; justify-content: space-between; align-items: flex-start; }
.cover-logo { height: 128px; width: auto; }
.cover-tags { display: flex; flex-direction: column; align-items: flex-end; gap: 9px; }
.tag-glass { padding: 8px 15px; border-radius: 999px; background: rgba(11,12,14,.6); border: 1px solid rgba(255,255,255,.22);
  font-size: 9px; font-weight: 700; letter-spacing: .25em; text-transform: uppercase; }
.services { font-size: 9px; font-weight: 700; letter-spacing: .35em; text-transform: uppercase; color: rgba(255,255,255,.85); }
.cover-body { position: absolute; left: .55in; right: .55in; bottom: 1.9in; }
.chip-red { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 999px; background: var(--red); color: #fff;
  font-size: 9.5px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; }
.cover h1 { display: block; font-size: 124px; line-height: .86; margin-top: 14px; transform-origin: left; }
.cover-lead { margin-top: 14px; max-width: 5.3in; font-size: 14px; color: rgba(255,255,255,.82); }
.facts { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 18px; }
.fact { display: inline-flex; align-items: center; gap: 7px; padding: 8px 12px; border-radius: 10px; background: rgba(255,255,255,.07);
  border: 1px solid rgba(255,255,255,.13); font-size: 10.5px; font-weight: 600; }
.fact .ico { color: var(--red); }
.stripes { position: absolute; right: .55in; bottom: 3.35in; width: 150px; height: 44px;
  background: repeating-linear-gradient(115deg, var(--red) 0 10px, transparent 10px 22px); }
.cover-bottom { position: absolute; left: .55in; right: .55in; bottom: .5in; display: flex; justify-content: space-between; align-items: flex-end;
  padding-top: 18px; border-top: 1px solid var(--line); }
.updated { text-align: right; font-size: 10px; color: var(--faint); }
.updated b { color: #fff; font-weight: 600; }

/* cómo funciona */
.steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 18px; }
.step { position: relative; overflow: hidden; padding: 16px; border-radius: 16px; background: var(--panel); border: 1px solid var(--line); }
.step .num { position: absolute; right: 12px; top: 4px; font-size: 60px; color: rgba(255,255,255,.07); }
.step-ico { width: 38px; height: 38px; display: grid; place-items: center; border-radius: 11px; background: var(--red-soft); color: var(--red); }
.step h4 { margin-top: 10px; font-size: 13.5px; font-weight: 700; }
.step p { margin-top: 3px; font-size: 10.5px; color: var(--muted); }
.builder { margin-top: 14px; padding: 16px 18px; border-radius: 18px; border: 1px solid rgba(225,6,0,.38);
  background: linear-gradient(135deg, rgba(225,6,0,.15), rgba(47,93,147,.07)); }
.builder .k { color: var(--red); }
.ex-row { display: flex; align-items: stretch; gap: 8px; margin-top: 10px; }
.ex-tile, .ex-total { flex: 1; display: flex; flex-direction: column; gap: 4px; padding: 10px 12px; border-radius: 12px;
  background: rgba(11,12,14,.65); border: 1px solid var(--line); }
.ex-tile b, .ex-total b { font-size: 10.5px; line-height: 1.25; }
.ex-tile .display { margin-top: auto; font-size: 26px; }
.ex-ico { color: var(--red); }
.ex-total { background: var(--red); border-color: var(--red); justify-content: flex-end; }
.ex-total .display { font-size: 34px; }
.op { align-self: center; font-size: 30px; color: var(--faint); }
.builder-note { margin-top: 10px; font-size: 10.5px; font-style: italic; color: var(--muted); }
.benefits { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; }
.benefit { display: flex; gap: 12px; padding: 13px 15px; border-radius: 14px; background: var(--panel); border: 1px solid var(--line); }
.benefit-ico { width: 36px; height: 36px; flex: none; display: grid; place-items: center; border-radius: 10px; background: var(--red-soft); color: var(--red); }
.benefit h4 { font-size: 12.5px; font-weight: 700; }
.benefit p { margin-top: 2px; font-size: 10.5px; color: var(--muted); }
.strip { flex: none; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: auto; }
.strip img { width: 100%; height: 170px; object-fit: cover; border-radius: 14px; display: block; }
.strip img:nth-child(2) { object-position: center 18%; }

/* paquetes */
.pkgs { flex: 1; min-height: 0; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 14px; margin-top: 16px; }
.pkg { display: flex; flex-direction: column; overflow: hidden; border-radius: 18px; background: var(--panel); border: 1px solid var(--line); }
.pkg.featured { border: 1.5px solid var(--red); box-shadow: 0 0 0 4px rgba(225,6,0,.13); }
.pkg-head { display: flex; align-items: center; gap: 12px; padding: 20px 18px; background: linear-gradient(135deg, var(--tone), color-mix(in srgb, var(--tone) 50%, #000)); }
.pkg-ico { width: 52px; height: 52px; flex: none; display: grid; place-items: center; border-radius: 13px; background: rgba(0,0,0,.25); color: #fff; }
.pkg-head h3 { font-size: 33px; white-space: nowrap; transform-origin: left; }
.pkg-tagline { display: block; margin-top: 2px; font-size: 9px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; color: rgba(255,255,255,.85); }
.best { display: flex; align-items: center; gap: 6px; margin: 14px 18px 0; padding: 7px 10px; border-radius: 10px; background: var(--red-soft);
  color: #FF8A85; font-size: 9.5px; font-weight: 700; }
.pkg .checks { padding: 16px 18px 12px; gap: 8px; }
.pkg .checks li { font-size: 11px; }
.pkg .checks .ico { color: var(--tone-light); }
.pkg-price { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-top: auto; padding: 16px 18px 18px;
  border-top: 1px solid var(--line); background: color-mix(in srgb, var(--tone) 16%, var(--panel)); }
.pkg-price .amount { font-size: 48px; }

/* comparativa */
.compare { width: 100%; margin-top: 16px; table-layout: fixed; border-collapse: separate; border-spacing: 0; overflow: hidden;
  border-radius: 16px; background: var(--panel); border: 1px solid var(--line); }
.compare .feature-col { width: 27%; }
.compare th { padding: 16px 8px; text-align: center; vertical-align: bottom; }
.compare th.feature-h { text-align: left; padding-left: 14px; background: #101215; font-size: 8.5px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; color: var(--faint); }
.compare th.pkg-th { background: linear-gradient(180deg, var(--tone), color-mix(in srgb, var(--tone) 50%, #000)); }
.compare th .display { font-size: 23px; }
.compare th .th-price { display: block; margin-top: 3px; font-size: 10.5px; font-weight: 700; }
.compare td { padding: 15px 8px; text-align: center; vertical-align: middle; font-size: 11px; line-height: 1.3; color: rgba(255,255,255,.86); border-top: 1px solid var(--line); }
.compare td.feature { padding-left: 14px; text-align: left; font-size: 11.5px; font-weight: 600; color: #fff; }
.compare td .ico { color: var(--tone-light); }
.compare td.none { color: var(--faint); }
.compare .cell-sub { display: block; margin-top: 2px; font-size: 9.5px; color: var(--muted); }
.compare .extra-price { font-family: 'Bebas Neue', Impact, sans-serif; font-size: 23px; color: #fff; }
.compare tr.section td { padding: 9px 14px; text-align: left; background: rgba(255,255,255,.035); font-size: 8.5px; font-weight: 700;
  letter-spacing: .2em; text-transform: uppercase; color: var(--red); }
.foot-note { display: flex; align-items: center; gap: 6px; margin-top: 10px; font-size: 10px; color: var(--muted); }
.foot-note .ico { color: var(--red); }
.callout { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-top: auto; padding: 18px 22px; border-radius: 18px;
  border: 1px solid rgba(225,6,0,.4); background: linear-gradient(135deg, rgba(225,6,0,.16), rgba(47,93,147,.08)); }
.callout h4 { font-size: 30px; transform-origin: left; }
.callout p { margin-top: 3px; max-width: 4.3in; font-size: 11px; color: var(--muted); }

/* extras */
.banner { position: relative; height: 215px; margin-top: 16px; overflow: hidden; border-radius: 18px; }
.banner img { width: 100%; height: 100%; object-fit: cover; object-position: center 62%; display: block; }
.banner::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, rgba(11,12,14,.92) 0%, rgba(11,12,14,.35) 55%, rgba(11,12,14,0)); }
.banner-text { position: absolute; z-index: 1; left: 24px; top: 50%; font-size: 42px; transform: translateY(-50%) skewX(-7deg); }
.extras { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 14px; }
.extra { display: flex; flex-direction: column; padding: 18px; border-radius: 16px; background: var(--panel); border: 1px solid var(--line); }
.extra-ico { width: 50px; height: 50px; display: grid; place-items: center; border-radius: 14px; background: var(--red); color: #fff; }
.extra h3 { display: block; margin-top: 12px; font-size: 26px; transform: none; }
.extra .amount { margin-top: 4px; color: var(--red); }
.extra > p { margin-top: 6px; font-size: 10.5px; color: var(--muted); }
.extra .checks { margin-top: 8px; }
.extra-note { display: flex; gap: 5px; margin-top: auto; padding-top: 10px; font-size: 9.5px; color: var(--faint); }
.combos { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 10px; }
.combo { display: flex; flex-direction: column; padding: 18px; border-radius: 16px; background: var(--panel); border: 1px solid var(--line); }
.combo .k { color: var(--red); }
.combo ul { list-style: none; display: grid; gap: 6px; margin-top: 10px; }
.combo li { display: flex; justify-content: space-between; gap: 8px; font-size: 11px; color: var(--muted); }
.combo li b { color: #fff; font-weight: 600; white-space: nowrap; }
.combo-total { display: flex; justify-content: space-between; align-items: baseline; margin-top: auto; padding-top: 8px; border-top: 1px dashed rgba(255,255,255,.18); }
.combo ul + .combo-total { margin-top: 10px; }
.combo-total span:first-child { font-size: 9px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; color: var(--faint); }
.combo-total .display { font-size: 32px; }

/* aparta */
.wa { position: relative; overflow: hidden; display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 24px; margin-top: 18px;
  padding: 36px 34px; border-radius: 20px; background: linear-gradient(135deg, #E10600, #8A0400); }
.wa::after { content: ''; position: absolute; left: 30px; bottom: 0; width: 140px; height: 12px;
  background: repeating-linear-gradient(115deg, rgba(255,255,255,.25) 0 8px, transparent 8px 18px); }
.wa .k { color: rgba(255,255,255,.78); }
.wa-number { margin-top: 4px; font-size: 70px; }
.wa p { margin-top: 2px; font-size: 12px; color: rgba(255,255,255,.92); }
.wa-actions { display: flex; align-items: center; gap: 16px; margin-top: 14px; }
.link-light { font-size: 10px; font-weight: 700; color: #fff; text-decoration: underline; }
.qr { width: 196px; height: 196px; padding: 13px; border-radius: 16px; background: #fff; }
.qr svg, .qr canvas { width: 170px !important; height: 170px !important; display: block; }
.tiles { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 14px; }
.tile { padding: 18px 16px; border-radius: 14px; background: var(--panel); border: 1px solid var(--line); }
.tile .ico { color: var(--red); }
.tile b { display: block; margin-top: 7px; font-size: 8.5px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; color: var(--faint); }
.tile span { display: block; margin-top: 2px; font-size: 11.5px; font-weight: 600; line-height: 1.3; }
.terms { margin-top: 14px; padding: 18px 20px; border-radius: 16px; background: var(--panel); border: 1px solid var(--line); }
.terms h3 { font-size: 26px; transform-origin: left; }
.terms ul { list-style: none; display: grid; grid-template-columns: 1fr 1fr; gap: 10px 24px; margin-top: 10px; }
.terms li { display: flex; gap: 7px; font-size: 11.5px; line-height: 1.4; color: var(--muted); }
.terms .ico { color: var(--red); margin-top: 2px; }
.closing { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; margin-top: auto; }
.closing .logo-box.logo-fpv { height: 84px; }
.brand-row { display: flex; align-items: center; gap: 10px; }
.social { font-size: 9.5px; line-height: 1.4; color: var(--muted); }
.social b { font-size: 11px; color: #fff; }
`;

function renderDocument(assets) {
  const pages = [
    coverPage(assets),
    howPage(assets),
    packagesPage(),
    comparePage(),
    extrasPage(assets),
    reservePage(assets),
  ];
  const total = pages.length;
  const numbered = pages.map((html, i) =>
    i === 0 ? html : html.replace(/<\/section>$/, `${footer(i + 1, total, assets)}</section>`),
  );

  return documentShell({
    title: 'Peñasco FPV · Cobertura Car Fest 2K26',
    css: CSS,
    body: numbered.join('\n'),
  });
}

async function main() {
  const assets = await loadAssets();
  const { htmlFile, kb } = printPdf({
    html: renderDocument(assets),
    outFile: OUT_FILE,
    workName: 'carfest-fpv',
  });
  console.log(`PDF listo: ${path.relative(ROOT, OUT_FILE)} (${kb} KB)`);
  console.log(`HTML de trabajo: ${htmlFile}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
