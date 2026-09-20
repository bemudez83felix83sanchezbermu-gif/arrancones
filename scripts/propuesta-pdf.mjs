// Genera el PDF de propuesta de hospedaje para clientes.
//
//   npm run propuesta:pdf
//
// Lee precios públicos de src/data/lodging.js y paquetes de src/data/proposal.js,
// arma un HTML tamaño carta y lo imprime con Chrome/Edge headless en
// public/propuesta/CarFest2K26-Propuesta-Hospedaje.pdf.
// Si el navegador no está en la ruta de siempre, define CHROME_PATH.

import path from 'node:path';
import { ROOT, coverPhoto, documentShell, esc, icon, logoImage, printPdf } from './lib/pdf-kit.mjs';
import { EVENT } from '../src/data/event.js';
import {
  PROPOSAL_PDF,
  RESERVATIONS_WHATSAPP_DISPLAY,
  activities,
  hotels,
  houses,
  reservationLink,
  restaurants,
  whatsappLink,
} from '../src/data/lodging.js';
import {
  findRoom,
  formatAmount,
  formatMoney,
  maxGuests,
  moneyParts,
  perGuestPerNight,
  proposalPackages,
  quotePackage,
  quoteRoom,
  savings,
  STAY_NIGHTS,
} from '../src/data/proposal.js';

const OUT_FILE = path.join(ROOT, 'public', PROPOSAL_PDF);

const UPDATED_AT = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'America/Hermosillo',
}).format(new Date());

const PROPOSAL_WHATSAPP = whatsappLink(
  'Hola, vi la propuesta de hospedaje del Car Fest 2K26 y quiero reservar.',
);

async function loadAssets() {
  const photos = {};
  for (const item of [...hotels, ...activities]) {
    photos[item.slug] = await coverPhoto(item.folder);
  }
  photos.cover = await coverPhoto('/hospedaje/hoteles/mannys-beach-club', 1800);

  return {
    photos,
    logos: {
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

function priceStack(quote, { size = '' } = {}) {
  const [main, ...rest] = moneyParts(quote.price);
  const strike = quote.strike ? formatMoney(quote.strike) : '';
  return `<div class="pstack ${size}">
    <span class="strike ${strike ? '' : 'empty'}">${strike ? esc(strike) : '&nbsp;'}</span>
    <span class="price display">${esc(main.text)}</span>
    ${rest.length ? `<span class="price-extra">+ ${esc(rest.map((p) => `${p.text} ${p.currency}`).join(' + '))}</span>` : ''}
  </div>`;
}

const footer = (n, total) => `<footer class="footer">
  <span>Car Fest 2K26 · Propuesta de hospedaje</span>
  <span><b>${String(n).padStart(2, '0')}</b> / ${String(total).padStart(2, '0')}</span>
</footer>`;

const heading = (eyebrow, title, lead = '') => `<div class="heading">
  <span class="eyebrow">${esc(eyebrow)}</span>
  <h2 class="display">${title}</h2>
  ${lead ? `<p class="lead">${esc(lead)}</p>` : ''}
</div>`;

const featuredHotel = proposalPackages.find((p) => p.featured)?.hotel;

// ---------- páginas ----------

function coverPage(assets) {
  return `<section class="page cover">
  <img class="cover-img" src="${assets.photos.cover}" alt="">
  <div class="cover-shade"></div>
  <header class="cover-top">
    <div>
      <div class="brand display">Car Fest <span>2K26</span></div>
      <div class="brand-sub">${esc(EVENT.city)}</div>
    </div>
    <span class="tag-glass">Propuesta de hospedaje</span>
  </header>
  <div class="cover-body">
    <span class="chip-gold">${icon('sparkles', 12)} Tarifa especial de evento</span>
    <h1 class="display">Tu fin de semana<br><span class="gold">en Puerto Peñasco</span></h1>
    <p class="cover-lead">Hospedaje, paquetes y experiencias para que solo te preocupes por disfrutar del ${esc(EVENT.name)}.</p>
    <div class="facts">
      <span class="fact">${icon('calendar')} ${esc(EVENT.displayDate)}</span>
      <span class="fact">${icon('pin')} ${esc(EVENT.venue)} · ${esc(EVENT.city)}</span>
      <span class="fact">${icon('zap')} Desfile · Drift · Car Show · Arrancones</span>
      <span class="fact">${icon('bed')} Hospedaje: noches del ${esc(STAY_NIGHTS.dates)}</span>
    </div>
  </div>
  <footer class="cover-bottom">
    <div>
      <div class="by">Reservaciones a cargo de</div>
      ${logoRow(assets, ['penascoTours', 'ingenia'])}
    </div>
    <div class="updated">Tarifas actualizadas al<br><b>${esc(UPDATED_AT)}</b></div>
  </footer>
</section>`;
}

function introPage(assets) {
  const days = EVENT.days
    .map(
      (d) => `<div class="day">
      <div class="day-label">${esc(d.label)} · <span class="gold">${esc(d.date.split(' ').slice(0, 2).join(' '))}</span></div>
      <div class="day-title display">${esc(d.title)}</div>
      <div class="day-tags">${d.activities.map((a) => `<span>${esc(a)}</span>`).join('')}</div>
    </div>`,
    )
    .join('');

  const benefits = [
    ['message', 'Un solo contacto', 'Hospedaje, comida y actividades con un mensaje de WhatsApp.'],
    ['tag', 'Tarifa especial de evento', 'Precios preferentes para quienes vienen al Car Fest.'],
    ['zap', 'Tu lugar asegurado', 'Apartamos tu habitación y tus paseos antes de que se agoten.'],
    ['pin', 'Atención local', 'Conocemos Puerto Peñasco y te recomendamos lo mejor.'],
  ]
    .map(
      ([ico, title, text]) => `<div class="benefit">
      <div class="benefit-ico">${icon(ico, 17)}</div>
      <div><h4>${esc(title)}</h4><p>${esc(text)}</p></div>
    </div>`,
    )
    .join('');

  const mosaic = ['hotel-playa-inn', 'barco-pirata', 'hotel-penasco-del-sol']
    .map((slug) => assets.photos[slug])
    .filter(Boolean)
    .map((src) => `<img src="${src}" alt="">`)
    .join('');

  return `<section class="page glow"><div class="content">
  ${heading(
    'Bienvenido',
    'Tú vienes por la adrenalina,<br><span class="gold">nosotros te hospedamos</span>',
    'Somos la agencia oficial de reservaciones del Car Fest 2K26. Elige dónde dormir, dónde comer y qué hacer en Puerto Peñasco, y nosotros coordinamos todo por ti.',
  )}
  <h3 class="subhead display">El evento</h3>
  <div class="days">${days}</div>
  <p class="venue">${icon('pin')} ${esc(EVENT.venue)} · ${esc(EVENT.city)}</p>

  <h3 class="subhead display">¿Por qué reservar con nosotros?</h3>
  <div class="benefits">${benefits}</div>

  <h3 class="subhead display">Cómo leer esta propuesta</h3>
  <div class="legend">
    <div><b>Por habitación</b><span>Cada precio es por habitación, no por persona.</span></div>
    <div><b>Noches ${esc(STAY_NIGHTS.short)}</b><span>Total de 1 noche o de las 2 noches del evento.</span></div>
    <div><b>Por persona</b><span>Precio de la habitación entre su capacidad máxima.</span></div>
  </div>

  <div class="mosaic">${mosaic}</div>
</div></section>`;
}

function packageCard(pkg, assets) {
  const { hotel, room } = findRoom(pkg.hotel, pkg.room);
  const one = quotePackage(pkg, 1);
  const two = quotePackage(pkg, 2);
  const weekendSaving = savings(two);

  const includes = [
    ['bed', `${hotel.name} · ${room.type}`],
    ['users', room.capacity],
    ...(pkg.perks ?? []).map((p) => ['check', p]),
    ...(pkg.extrasLabel ? [['ship', pkg.extrasLabel]] : []),
  ]
    .map(([ico, text]) => `<li>${icon(ico, 12)}<span>${esc(text)}</span></li>`)
    .join('');

  const foot = pkg.extras?.length
    ? 'Paseo en barco incluido una vez'
    : `Desde ${formatMoney(perGuestPerNight(room))} por persona por noche`;

  const reserve = whatsappLink(
    `Hola, me interesa el paquete ${pkg.name} (${hotel.name}) para el Car Fest 2K26.`,
  );

  return `<article class="pkg ${pkg.featured ? 'featured' : ''}">
    <div class="pkg-photo">
      ${assets.photos[hotel.slug] ? `<img src="${assets.photos[hotel.slug]}" alt="">` : ''}
      <span class="pkg-tier">${pkg.featured ? icon('star', 11) : ''} ${esc(pkg.tier)}</span>
      ${weekendSaving ? `<span class="save">Ahorras ${esc(formatMoney(weekendSaving))}</span>` : ''}
    </div>
    <div class="pkg-body">
      <h3 class="display">${esc(pkg.name)}</h3>
      <ul class="checks">${includes}</ul>
      <div class="pkg-prices">
        <div><span class="k">1 noche</span><span class="k-sub">${esc(STAY_NIGHTS.single)}</span>${priceStack(one)}</div>
        <div><span class="k">2 noches</span><span class="k-sub">${esc(STAY_NIGHTS.short)}</span>${priceStack(two)}</div>
      </div>
      <div class="pkg-foot">
        <span>${esc(foot)}</span>
        <a href="${reserve}">Reservar ${icon('arrow', 11)}</a>
      </div>
    </div>
  </article>`;
}

function packagesPage(assets) {
  return `<section class="page glow"><div class="content">
  ${heading(
    'Paquetes Car Fest',
    'Elige tu <span class="gold">fin de semana</span>',
    `Todo resuelto en un solo precio. Cotiza 1 noche o las 2 noches del evento: ${STAY_NIGHTS.dates}.`,
  )}
  <div class="pkgs">${proposalPackages.map((p) => packageCard(p, assets)).join('')}</div>
</div></section>`;
}

function ratesPage(assets) {
  const rows = hotels
    .map((hotel) =>
      hotel.rooms
        .map((room, i) => {
          const one = quoteRoom(room, 1);
          const two = quoteRoom(room, 2);
          const hotelCell =
            i === 0
              ? `<td rowspan="${hotel.rooms.length}" class="hotel-td">
                <div class="hotel-cell">
                  ${assets.photos[hotel.slug] ? `<img src="${assets.photos[hotel.slug]}" alt="">` : ''}
                  <div><b>${esc(hotel.name)}</b><span>${esc(hotel.badge)}</span></div>
                </div>
              </td>`
              : '';
          const cell = (q) => `<td class="r cell-price">
            ${q.strike ? `<s>${esc(formatMoney(q.strike))}</s>` : ''}
            <b>${esc(formatMoney(q.price))}</b>
          </td>`;
          return `<tr class="${i === hotel.rooms.length - 1 ? 'group-end' : ''}">
            ${hotelCell}
            <td><div class="room-type">${esc(room.type)}</div><div class="room-cap">${esc(room.capacity)}${room.priceLabel ? ` · ${esc(room.priceLabel)}` : ''}</div></td>
            ${cell(one)}
            ${cell(two)}
            <td class="r cell-price"><b class="soft">${esc(formatMoney(perGuestPerNight(room)))}</b><s class="plain">con ${maxGuests(room.capacity)} personas</s></td>
          </tr>`;
        })
        .join(''),
    )
    .join('');

  const usdHotels = hotels.filter((h) => h.rooms.some((r) => r.currency === 'USD'));

  return `<section class="page glow"><div class="content">
  ${heading(
    'Cotización por habitación',
    'Todas las opciones <span class="gold">de un vistazo</span>',
    `Precios por habitación con tarifa Car Fest para las noches del ${STAY_NIGHTS.dates}.`,
  )}
  <table class="rates">
    <thead><tr>
      <th>Hotel</th><th>Habitación</th><th class="r">1 noche<small>${esc(STAY_NIGHTS.single)}</small></th><th class="r">2 noches<small>${esc(STAY_NIGHTS.short)}</small></th><th class="r">Por persona / noche</th>
    </tr></thead>
    <tbody>
      ${rows}
      <tr class="group-end last">
        <td class="hotel-td"><div class="hotel-cell"><div class="casa-thumb">${icon('home', 18)}</div><div><b>Casas privadas</b><span>Comonfort</span></div></div></td>
        <td><div class="room-type">Casa Peñasco #1 a #${houses.length}</div><div class="room-cap">Ideal para grupos y familias</div></td>
        <td colspan="3" class="r"><span class="quote-pill">Cotización personalizada</span></td>
      </tr>
    </tbody>
  </table>
  ${usdHotels.length ? `<p class="table-note">${icon('info', 12)} ${esc(usdHotels.map((h) => h.name).join(', '))} cotiza en dólares (USD), con desayuno e impuestos incluidos. El resto de los precios están en pesos mexicanos.</p>` : ''}

  <div class="callout">
    <div>
      <h4 class="display">¿Vienen más de 4 o necesitan más noches?</h4>
      <p>Te armamos una cotización a la medida con varias habitaciones, casas privadas y actividades.</p>
    </div>
    <a class="btn btn-gold" href="${PROPOSAL_WHATSAPP}">${icon('message', 13)} Cotizar por WhatsApp</a>
  </div>
</div></section>`;
}

function hotelCard(hotel, assets) {
  const featured = hotel.slug === featuredHotel;
  const bestSaving = hotel.rooms.reduce((best, r) => {
    const amount = (r.priceStrike ?? 0) - r.price;
    return amount > best.amount ? { amount, currency: r.currency ?? 'MXN' } : best;
  }, { amount: 0, currency: 'MXN' });

  const rooms = hotel.rooms
    .map((room) => {
      const perGuest = perGuestPerNight(room);
      return `<div class="room">
        <div class="room-head">
          <span class="room-type">${esc(room.type)}</span>
          <span class="room-cap">${icon('users', 11)} ${esc(room.capacity)}${room.priceLabel ? ` · ${esc(room.priceLabel)}` : ''}</span>
        </div>
        <div class="room-prices">
          <div><span class="k">1 noche</span>${priceStack(quoteRoom(room, 1), { size: 'sm' })}</div>
          <div><span class="k">2 noches</span>${priceStack(quoteRoom(room, 2), { size: 'sm' })}</div>
          <div><span class="k">Por persona</span><div class="pstack sm"><span class="strike empty">&nbsp;</span><span class="price display soft">${esc(formatMoney(perGuest))}<small> / noche</small></span></div></div>
        </div>
      </div>`;
    })
    .join('');

  const notes = hotel.notes ?? [];

  // Gancho al paquete donde aparece este hotel.
  const pkg = proposalPackages.find((p) => p.hotel === hotel.slug);
  const pkgMini = pkg
    ? `<div class="pkg-mini">
        <div>
          <span class="k">${icon('sparkles', 10)} También en paquete</span>
          <b class="display">${esc(pkg.name)}</b>
          ${pkg.extrasLabel ? `<span class="price-extra">${esc(pkg.extrasLabel)}</span>` : ''}
        </div>
        <div class="r">
          <span class="k">2 noches</span>
          <span class="price display">${esc(formatMoney(quotePackage(pkg, 2).price))}</span>
        </div>
      </div>`
    : '';

  return `<article class="ficha ${featured ? 'featured' : ''}">
    <div class="ficha-photo">
      ${assets.photos[hotel.slug] ? `<img src="${assets.photos[hotel.slug]}" alt="">` : ''}
      ${bestSaving.amount > 0 ? `<span class="save">Ahorra hasta ${esc(formatAmount(bestSaving.amount, bestSaving.currency))} por noche</span>` : ''}
    </div>
    <div class="ficha-body">
      <div class="badges">
        ${featured ? `<span class="badge solid">${icon('star', 10)} Recomendado</span>` : ''}
        <span class="badge">${esc(hotel.badge)}</span>
      </div>
      <h3 class="display">${esc(hotel.name)}</h3>
      <p class="tagline">${esc(hotel.tagline)}</p>
      ${notes.length ? `<p class="note">${icon('info', 12)}<span>${esc(notes.join(' '))}</span></p>` : ''}
      <div class="rooms ${hotel.rooms.length === 1 ? 'single' : ''}">${rooms}</div>
      ${pkgMini}
      <div class="cta-row">
        <a class="btn btn-gold" href="${reservationLink(hotel)}">${icon('message', 12)} Reservar</a>
        <a class="btn btn-ghost" href="${hotel.mapsUrl}">${icon('pin', 12)} Ver ubicación</a>
      </div>
    </div>
  </article>`;
}

function housesCard() {
  const link = reservationLink({ name: 'las Casas Peñasco' }, 'Quiero información y disponibilidad.');
  return `<article class="ficha">
    <div class="ficha-photo casas">
      <div class="casas-art">
        ${icon('home', 46)}
        <span class="display">${houses.length} casas</span>
        <small>privadas en Comonfort</small>
      </div>
    </div>
    <div class="ficha-body">
      <div class="badges"><span class="badge">Casa privada</span></div>
      <h3 class="display">Casas Peñasco</h3>
      <p class="tagline">${esc(houses[0]?.tagline)}</p>
      <ul class="checks roomy">
        <li>${icon('home', 12)}<span>Casa Peñasco #1 a #${houses.length}, cada una completa para tu grupo.</span></li>
        <li>${icon('users', 12)}<span>Más espacio y privacidad que un hotel: ideal para familias y equipos.</span></li>
        <li>${icon('tag', 12)}<span>Tarifa por noche según fechas y número de personas.</span></li>
      </ul>
      <div class="quote-box">
        <span class="k">Precio</span>
        <span class="display">Cotización personalizada</span>
        <span class="price-extra">Consulta disponibilidad para el fin de semana del evento.</span>
      </div>
      <div class="cta-row">
        <a class="btn btn-gold" href="${link}">${icon('message', 12)} Consultar disponibilidad</a>
      </div>
    </div>
  </article>`;
}

function hotelPages(assets) {
  const titles = [
    [`Hoteles con tarifa Car Fest · noches ${STAY_NIGHTS.short}`, 'Los favoritos <span class="gold">del fin de semana</span>'],
    [`Hoteles con tarifa Car Fest · noches ${STAY_NIGHTS.short}`, 'Playa y centro <span class="gold">a buen precio</span>'],
    [`Hoteles y casas · noches ${STAY_NIGHTS.short}`, 'Malecón y <span class="gold">casas privadas</span>'],
  ];
  const cards = [...hotels.map((h) => hotelCard(h, assets)), housesCard()];
  const pages = [];
  for (let i = 0; i < cards.length; i += 2) {
    const [eyebrow, title] = titles[pages.length] ?? titles.at(-1);
    pages.push(`<section class="page glow"><div class="content">
      ${heading(eyebrow, title)}
      <div class="fichas">${cards.slice(i, i + 2).join('')}</div>
    </div></section>`);
  }
  return pages;
}

function experiencesPage(assets) {
  const boat = activities.find((a) => a.slug === 'barco-pirata');
  const tiles = (boat?.packages ?? [])
    .map(
      (p) => `<div class="tile">
      <h5>${esc(p.name)}</h5>
      <span class="price display">${esc(formatAmount(p.price))}</span>
      <small>por persona</small>
      <p>${esc(p.details)}</p>
    </div>`,
    )
    .join('');

  const food = restaurants
    .map(
      (r) => `<div class="food-card">
      <div class="benefit-ico">${icon('utensils', 17)}</div>
      <div>
        <span class="badge">${esc(r.badge)}</span>
        <h4 class="display">${esc(r.name)}</h4>
        <p>${esc(r.tagline.split('. ')[0].replace(/\.?$/, '.'))}</p>
        <a class="link" href="${reservationLink(r)}">Te ayudamos a reservar tu mesa ${icon('arrow', 11)}</a>
      </div>
    </div>`,
    )
    .join('');

  return `<section class="page glow"><div class="content">
  ${heading('Experiencias', 'Vive Puerto Peñasco <span class="gold">más allá de la pista</span>')}
  ${
    boat
      ? `<article class="barco">
    <div class="barco-photo">
      ${assets.photos[boat.slug] ? `<img src="${assets.photos[boat.slug]}" alt="">` : ''}
      <div class="barco-title">
        <span class="badge solid">${icon('ship', 11)} ${esc(boat.badge)}</span>
        <h3 class="display">Barco Pirata Perla Negra</h3>
        <p>${esc(boat.tagline)}</p>
      </div>
    </div>
    <div class="barco-body">
      <div class="tiles">${tiles}</div>
      <div class="barco-foot">
        <span>${icon('calendar', 12)} ${esc(boat.highlights?.[0] ?? '')}</span>
        <span class="links">
          <a class="link" href="${boat.externalUrl}">${esc(boat.externalLabel)}</a>
          <a class="btn btn-gold" href="${reservationLink(boat)}">${icon('message', 12)} Reservar paseo</a>
        </span>
      </div>
    </div>
  </article>`
      : ''
  }
  <h3 class="subhead display">Gastronomía</h3>
  <div class="food">${food}</div>

  <div class="callout">
    <div>
      <h4 class="display">Súmalo a tu hospedaje</h4>
      <p>Agrega el paseo en barco o tu mesa a la misma reservación. Lo coordinamos todo en un solo mensaje.</p>
    </div>
    <a class="btn btn-gold" href="${PROPOSAL_WHATSAPP}">${icon('message', 13)} Agregar a mi reserva</a>
  </div>
</div></section>`;
}

function reservePage(assets) {
  const usdHotels = hotels.filter((h) => h.rooms.some((r) => r.currency === 'USD')).map((h) => h.name);
  const terms = [
    'Precios por habitación por noche, sujetos a disponibilidad al momento de reservar.',
    usdHotels.length
      ? `Precios en pesos mexicanos (MXN). ${usdHotels.join(', ')} se cotiza en dólares (USD) con desayuno e impuestos incluidos.`
      : 'Precios en pesos mexicanos (MXN).',
    'El precio por persona se calcula con la capacidad máxima de cada habitación.',
    'Los paseos en Barco Pirata se cobran por persona y se incluyen una sola vez en cada paquete.',
    `Tarifas confirmadas con cada hotel para las noches del ${STAY_NIGHTS.dates} de 2026.`,
    'Las condiciones de pago y cancelación se confirman al reservar. Cupo limitado.',
  ]
    .map((t) => `<li>${icon('check', 12)}<span>${esc(t)}</span></li>`)
    .join('');

  const steps = [
    ['Elige tu opción', 'Un paquete, un hotel o una casa privada, por 1 noche o las 2 noches del evento.'],
    ['Escríbenos por WhatsApp', 'Dinos qué te gustó y cuántas personas vienen. Confirmamos disponibilidad.'],
    ['Aparta y listo', 'Te compartimos los datos de pago y la confirmación de tu reservación.'],
  ]
    .map(
      ([title, text], i) => `<div class="step">
      <span class="num display">0${i + 1}</span>
      <h4>${esc(title)}</h4>
      <p>${esc(text)}</p>
    </div>`,
    )
    .join('');

  return `<section class="page glow"><div class="content">
  ${heading('Reserva hoy', 'Aparta tu lugar <span class="gold">en 3 pasos</span>')}
  <div class="steps">${steps}</div>

  <div class="wa">
    <div>
      <span class="k">Reservaciones por WhatsApp</span>
      <div class="wa-number display">${esc(RESERVATIONS_WHATSAPP_DISPLAY)}</div>
      <p>Escanea el código o toca el botón y cuéntanos que viste esta propuesta.</p>
      <a class="btn btn-dark" href="${PROPOSAL_WHATSAPP}">${icon('message', 13)} Escribir ahora</a>
    </div>
    <div class="qr" data-qr="${esc(PROPOSAL_WHATSAPP)}"></div>
  </div>

  <div class="terms">
    <h3 class="display">Condiciones</h3>
    <ul>${terms}</ul>
  </div>

  <div class="closing">
    <div>
      <div class="by">Reservaciones a cargo de</div>
      ${logoRow(assets, ['penascoTours', 'ingenia'])}
    </div>
    <div>
      <div class="by">Evento organizado por</div>
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
  --gold: #F5B301; --gold-soft: rgba(245,179,1,.13); --red: #E10600; --ink: #0A0A0A;
  --panel: #141414; --line: rgba(255,255,255,.09); --muted: rgba(255,255,255,.66); --faint: rgba(255,255,255,.42);
}
html, body { background: var(--ink); }
body { font-family: 'Inter', system-ui, sans-serif; color: #fff; font-size: 11px; line-height: 1.45; }
a { color: inherit; text-decoration: none; }
.display { font-family: 'Bebas Neue', Impact, sans-serif; font-weight: 400; line-height: .95; letter-spacing: .01em; }
.gold { color: var(--gold); }
.ico { display: inline-block; flex: none; vertical-align: -2px; }

.page { position: relative; width: 8.5in; height: 11in; overflow: hidden; background: var(--ink); break-after: page; }
.page:last-child { break-after: auto; }
.page.glow::before { content: ''; position: absolute; inset: 0;
  background: radial-gradient(circle at 0% 0%, rgba(245,179,1,.14), transparent 38%),
              radial-gradient(circle at 100% 20%, rgba(37,150,190,.13), transparent 42%),
              radial-gradient(circle at 50% 112%, rgba(225,6,0,.12), transparent 50%); }
.content { position: absolute; top: .55in; left: .55in; right: .55in; bottom: .8in; display: flex; flex-direction: column; }
.footer { position: absolute; left: .55in; right: .55in; bottom: .34in; display: flex; justify-content: space-between; padding-top: 9px;
  border-top: 1px solid var(--line); font-size: 8.5px; font-weight: 600; letter-spacing: .22em; text-transform: uppercase; color: var(--faint); }
.footer b { color: var(--gold); }

.eyebrow { font-size: 10px; font-weight: 700; letter-spacing: .3em; text-transform: uppercase; color: var(--gold); }
.heading h2 { font-size: 50px; margin-top: 6px; }
.lead { margin-top: 8px; max-width: 5.8in; font-size: 12.5px; color: var(--muted); }
.subhead { font-size: 24px; margin-top: 22px; }
.k { display: block; font-size: 8.5px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; color: var(--faint); }
.badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 9px; border-radius: 999px; border: 1px solid rgba(245,179,1,.45);
  color: var(--gold); font-size: 8.5px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; }
.badge.solid { background: var(--gold); color: var(--ink); border-color: var(--gold); }
.save { position: absolute; z-index: 2; right: 12px; top: 12px; padding: 5px 10px; border-radius: 999px; background: var(--red); color: #fff;
  font-size: 9px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; box-shadow: 0 6px 18px rgba(225,6,0,.35); }
.btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 999px; font-size: 9.5px; font-weight: 800;
  letter-spacing: .12em; text-transform: uppercase; white-space: nowrap; }
.btn-gold { background: var(--gold); color: var(--ink); }
.btn-ghost { border: 1px solid rgba(255,255,255,.22); color: rgba(255,255,255,.85); }
.btn-dark { background: var(--ink); color: #fff; }
.link { display: inline-flex; align-items: center; gap: 4px; color: var(--gold); font-weight: 700; font-size: 10px; }

.pstack { display: flex; flex-direction: column; }
.strike { font-size: 10px; color: var(--faint); text-decoration: line-through; line-height: 1.3; }
.price { color: var(--gold); font-size: 30px; line-height: 1; margin-top: 1px; }
.strike.empty { text-decoration: none; }
.k-sub { display: block; font-size: 8.5px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--gold); }
.rates th small { display: block; margin-top: 2px; font-size: 8px; letter-spacing: .1em; color: var(--gold); }
.price small { font-family: 'Inter', system-ui, sans-serif; font-size: 9px; font-weight: 600; letter-spacing: 0; color: var(--faint); }
.price.soft, b.soft { color: #fff; }
.pstack.sm .price { font-size: 22px; }
.rooms.single .pstack.sm .price { font-size: 30px; }
.price-extra { font-size: 9px; color: var(--muted); font-weight: 600; margin-top: 2px; }

/* portada */
.cover-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 35% center; }
.cover-shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(10,10,10,.78) 0%, rgba(10,10,10,.1) 20%,
  rgba(10,10,10,.05) 38%, rgba(10,10,10,.8) 60%, #0A0A0A 80%); }
.cover-top { position: absolute; top: .5in; left: .55in; right: .55in; display: flex; justify-content: space-between; align-items: center; }
.brand { font-size: 32px; letter-spacing: .03em; }
.brand span { color: var(--gold); }
.brand-sub { font-size: 9px; font-weight: 600; letter-spacing: .3em; text-transform: uppercase; color: rgba(255,255,255,.8); }
.tag-glass { padding: 8px 15px; border-radius: 999px; background: rgba(10,10,10,.55); border: 1px solid rgba(255,255,255,.2);
  font-size: 9px; font-weight: 700; letter-spacing: .25em; text-transform: uppercase; }
.cover-body { position: absolute; left: .55in; right: .55in; bottom: 1.95in; }
.chip-gold { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 999px; background: var(--gold); color: var(--ink);
  font-size: 9.5px; font-weight: 800; letter-spacing: .2em; text-transform: uppercase; }
.cover h1 { font-size: 100px; line-height: .88; margin-top: 16px; }
.cover-lead { margin-top: 14px; max-width: 5.4in; font-size: 14px; color: rgba(255,255,255,.8); }
.facts { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 18px; }
.fact { display: inline-flex; align-items: center; gap: 7px; padding: 8px 12px; border-radius: 10px; background: rgba(255,255,255,.07);
  border: 1px solid rgba(255,255,255,.13); font-size: 10.5px; font-weight: 600; }
.fact .ico { color: var(--gold); }
.cover-bottom { position: absolute; left: .55in; right: .55in; bottom: .5in; display: flex; justify-content: space-between; align-items: flex-end;
  padding-top: 18px; border-top: 1px solid var(--line); }
.by { margin-bottom: 8px; font-size: 8.5px; font-weight: 700; letter-spacing: .25em; text-transform: uppercase; color: var(--faint); }
.logos { display: flex; gap: 10px; }
.logo-box { height: 56px; padding: 7px 14px; border-radius: 12px; background: #fff; display: flex; align-items: center; }
.logo-box img { height: 100%; width: auto; display: block; }
.logo-box.logo-penascoTours { padding: 3px 12px; }
.logo-box.logo-ingenia img { height: 62%; }
.updated { text-align: right; font-size: 9.5px; color: var(--faint); }
.updated b { color: #fff; font-weight: 600; }

/* bienvenida */
.days { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 10px; }
.day { position: relative; overflow: hidden; padding: 14px 18px 14px 22px; border-radius: 16px; background: var(--panel); border: 1px solid var(--line); }
.day::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: var(--red); }
.day:nth-child(2)::before { background: var(--gold); }
.day:nth-child(3)::before { background: #2596BE; }
.day-label { font-size: 9px; font-weight: 700; letter-spacing: .2em; text-transform: uppercase; color: var(--faint); }
.day-title { font-size: 26px; margin-top: 4px; }
.day-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
.day-tags span { padding: 3px 9px; border-radius: 999px; background: rgba(255,255,255,.07); font-size: 9px; font-weight: 600; color: var(--muted); }
.venue { display: flex; align-items: center; gap: 6px; margin-top: 10px; font-size: 11px; color: var(--muted); }
.venue .ico { color: var(--gold); }
.benefits { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; }
.benefit { display: flex; gap: 12px; padding: 13px 15px; border-radius: 14px; background: var(--panel); border: 1px solid var(--line); }
.benefit-ico { width: 36px; height: 36px; flex: none; display: grid; place-items: center; border-radius: 10px; background: var(--gold-soft); color: var(--gold); }
.benefit h4 { font-size: 12.5px; font-weight: 700; }
.benefit p { margin-top: 2px; font-size: 10.5px; color: var(--muted); }
.legend { display: grid; grid-template-columns: repeat(3, 1fr); margin-top: 10px; border-radius: 14px; border: 1px solid rgba(245,179,1,.32);
  background: linear-gradient(135deg, rgba(245,179,1,.11), rgba(245,179,1,.02)); }
.legend div { padding: 12px 14px; }
.legend div + div { border-left: 1px solid rgba(245,179,1,.2); }
.legend b { display: block; font-size: 9.5px; letter-spacing: .16em; text-transform: uppercase; color: var(--gold); }
.legend span { font-size: 10.5px; color: var(--muted); }
.mosaic { display: grid; grid-template-columns: 1.3fr 1fr 1fr; gap: 10px; height: 165px; margin-top: auto; flex: none; }
.mosaic img { width: 100%; height: 100%; object-fit: cover; border-radius: 14px; display: block; }

/* paquetes */
.pkgs { flex: 1; min-height: 0; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 14px; margin-top: 16px; }
.pkg { position: relative; display: flex; flex-direction: column; overflow: hidden; border-radius: 18px; background: var(--panel); border: 1px solid var(--line); }
.pkg.featured { border: 1.5px solid var(--gold); background: linear-gradient(180deg, #221a04 0%, var(--panel) 55%); box-shadow: 0 0 0 4px rgba(245,179,1,.1); }
.pkg-photo { position: relative; height: 156px; flex: none; }
.pkg-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
.pkg-photo::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(20,20,20,0) 35%, rgba(20,20,20,.97)); }
.pkg.featured .pkg-photo::after { background: linear-gradient(180deg, rgba(34,26,4,0) 35%, rgba(34,26,4,.97)); }
.pkg-tier { position: absolute; z-index: 2; left: 12px; top: 12px; display: inline-flex; align-items: center; gap: 4px; padding: 5px 10px; border-radius: 999px;
  background: rgba(10,10,10,.7); border: 1px solid rgba(255,255,255,.18); font-size: 9px; font-weight: 800; letter-spacing: .18em; text-transform: uppercase; }
.pkg.featured .pkg-tier { background: var(--gold); color: var(--ink); border-color: var(--gold); }
.pkg-body { position: relative; z-index: 2; flex: 1; display: flex; flex-direction: column; padding: 0 16px 13px; margin-top: -24px; }
.pkg h3 { font-size: 31px; }
.checks { list-style: none; display: grid; gap: 4px; margin-top: 7px; }
.checks li { display: flex; gap: 7px; font-size: 10.5px; line-height: 1.35; color: rgba(255,255,255,.84); }
.checks .ico { color: var(--gold); margin-top: 1px; }
.checks.roomy { gap: 7px; margin-top: 10px; }
.pkg-prices { display: grid; grid-template-columns: 1fr 1fr; margin-top: auto; border-radius: 12px; background: rgba(255,255,255,.045); border: 1px solid var(--line); }
.pkg-prices > div { padding: 9px 12px; }
.pkg-prices > div + div { border-left: 1px solid var(--line); }
.pkg-foot { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; font-size: 9.5px; color: var(--muted); }
.pkg-foot a { display: inline-flex; align-items: center; gap: 4px; color: var(--gold); font-weight: 800; letter-spacing: .1em; text-transform: uppercase; font-size: 9px; }

/* tabla */
.rates { width: 100%; margin-top: 16px; border-collapse: separate; border-spacing: 0; overflow: hidden; border-radius: 16px; background: var(--panel); border: 1px solid var(--line); }
.rates th { padding: 10px 12px; text-align: left; white-space: nowrap; background: #0f0f0f; border-bottom: 1px solid var(--line);
  font-size: 8.5px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; color: var(--faint); }
.rates td { padding: 11px 12px; vertical-align: middle; border-bottom: 1px solid rgba(255,255,255,.05); }
.rates tr.group-end td, .rates td.hotel-td { border-bottom: 1px solid var(--line); }
.rates tr.last td { border-bottom: none; }
.rates .r { text-align: right; }
.hotel-cell { display: flex; align-items: center; gap: 10px; }
.hotel-cell img, .casa-thumb { width: 64px; height: 48px; flex: none; border-radius: 8px; object-fit: cover; }
.casa-thumb { display: grid; place-items: center; background: linear-gradient(135deg, #12384a, #1a1a1a); color: var(--gold); }
.hotel-cell b { display: block; font-size: 11.5px; line-height: 1.2; }
.hotel-cell span { font-size: 8px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; color: var(--gold); }
.room-type { font-size: 11px; font-weight: 600; }
.room-cap { display: inline-flex; align-items: center; gap: 4px; font-size: 9.5px; color: var(--faint); }
.cell-price b { font-family: 'Bebas Neue', Impact, sans-serif; font-weight: 400; font-size: 21px; line-height: 1; color: var(--gold); display: block; }
.cell-price s { display: block; font-size: 9.5px; color: var(--faint); }
.cell-price s.plain { text-decoration: none; }
.quote-pill { display: inline-block; padding: 6px 12px; border-radius: 999px; background: var(--gold-soft); color: var(--gold);
  font-size: 9px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; }
.table-note { display: flex; align-items: center; gap: 6px; margin-top: 10px; font-size: 10px; color: var(--muted); }
.table-note .ico { color: var(--gold); }
.callout { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-top: auto; padding: 18px 22px; border-radius: 18px;
  border: 1px solid rgba(245,179,1,.35); background: linear-gradient(135deg, rgba(245,179,1,.14), rgba(37,150,190,.08)); }
.callout h4 { font-size: 28px; }
.callout p { margin-top: 3px; font-size: 11px; color: var(--muted); max-width: 4.2in; }

/* fichas de hotel */
.fichas { flex: 1; min-height: 0; display: grid; grid-template-rows: 1fr 1fr; gap: 16px; margin-top: 16px; }
.ficha { display: grid; grid-template-columns: 2.75in 1fr; min-height: 0; overflow: hidden; border-radius: 18px; background: var(--panel); border: 1px solid var(--line); }
.ficha.featured { border: 1.5px solid var(--gold); box-shadow: 0 0 0 4px rgba(245,179,1,.1); }
.ficha-photo { position: relative; overflow: hidden; }
.ficha-photo img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.ficha-photo .save { left: 12px; right: auto; }
.ficha-photo.casas { background: radial-gradient(circle at 30% 20%, rgba(245,179,1,.25), transparent 55%), linear-gradient(160deg, #12384a, #0d0d0d 75%); }
.casas-art { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: var(--gold); text-align: center; }
.casas-art .display { font-size: 54px; color: #fff; }
.casas-art small { font-size: 9px; font-weight: 700; letter-spacing: .25em; text-transform: uppercase; color: var(--muted); }
.ficha-body { display: flex; flex-direction: column; min-width: 0; padding: 16px 18px 15px; }
.badges { display: flex; gap: 6px; }
.ficha h3 { font-size: 36px; margin-top: 7px; }
.tagline { margin-top: 2px; font-size: 11px; color: var(--muted); }
.note { display: flex; gap: 6px; margin-top: 7px; padding: 6px 9px; border-radius: 9px; background: rgba(255,255,255,.04); font-size: 9.5px; line-height: 1.35; color: var(--muted); }
.note .ico { color: var(--gold); margin-top: 1px; }
.rooms { display: grid; gap: 7px; margin-top: 9px; }
.room { padding: 8px 12px; border-radius: 12px; background: rgba(255,255,255,.035); border: 1px solid var(--line); }
.room-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.room-prices { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 4px; }
.cta-row { display: flex; gap: 8px; margin-top: auto; padding-top: 10px; }
.quote-box { display: flex; flex-direction: column; margin-top: 12px; padding: 11px 14px; border-radius: 12px; background: rgba(255,255,255,.045); border: 1px solid var(--line); }
.quote-box .display { font-size: 26px; color: var(--gold); margin-top: 2px; }
.pkg-mini { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-top: 8px; padding: 8px 12px; border-radius: 12px;
  border: 1px dashed rgba(245,179,1,.45); background: rgba(245,179,1,.06); }
.pkg-mini b { display: block; font-size: 20px; font-weight: 400; margin-top: 2px; }
.pkg-mini .r { text-align: right; flex: none; }
.pkg-mini .price { font-size: 24px; }

/* experiencias */
.barco { margin-top: 16px; overflow: hidden; border-radius: 18px; background: var(--panel); border: 1px solid var(--line); }
.barco-photo { position: relative; height: 3.1in; }
.barco-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
.barco-photo::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(20,20,20,0) 30%, rgba(20,20,20,.96)); }
.barco-title { position: absolute; z-index: 2; left: 18px; right: 18px; bottom: 12px; }
.barco-title h3 { font-size: 42px; margin-top: 6px; }
.barco-title p { font-size: 11.5px; color: rgba(255,255,255,.78); }
.barco-body { padding: 12px 16px 14px; }
.tiles { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.tile { display: flex; flex-direction: column; padding: 11px 12px; border-radius: 12px; background: rgba(255,255,255,.04); border: 1px solid var(--line); }
.tile h5 { font-size: 11px; font-weight: 700; }
.tile .price { font-size: 30px; margin-top: 5px; }
.tile small { font-size: 8px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; color: var(--faint); }
.tile p { margin-top: 5px; font-size: 9.5px; line-height: 1.35; color: var(--muted); }
.barco-foot { display: flex; justify-content: space-between; align-items: center; margin-top: 11px; font-size: 10px; color: var(--muted); }
.barco-foot .ico { color: var(--gold); }
.barco-foot .links { display: flex; align-items: center; gap: 14px; }
.food { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 10px; }
.food-card { display: flex; gap: 12px; padding: 15px 16px; border-radius: 16px; background: var(--panel); border: 1px solid var(--line); }
.food-card h4 { font-size: 24px; margin-top: 6px; }
.food-card p { margin-top: 2px; font-size: 10.5px; color: var(--muted); }
.food-card .link { margin-top: 8px; }

/* reserva */
.steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 18px; }
.step { padding: 14px 16px; border-radius: 16px; background: var(--panel); border: 1px solid var(--line); }
.step .num { font-size: 44px; color: var(--gold); }
.step h4 { margin-top: 2px; font-size: 13px; font-weight: 700; }
.step p { margin-top: 3px; font-size: 10.5px; color: var(--muted); }
.wa { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 24px; margin-top: 16px; padding: 28px 30px; border-radius: 20px;
  background: linear-gradient(135deg, #F5B301, #FFD24D); color: var(--ink); }
.wa .k { color: rgba(10,10,10,.62); }
.wa-number { font-size: 64px; margin-top: 4px; }
.wa p { margin-top: 2px; font-size: 12px; font-weight: 500; }
.wa .btn { margin-top: 14px; }
.qr { width: 196px; height: 196px; padding: 13px; border-radius: 16px; background: #fff; }
.qr svg, .qr canvas { width: 170px !important; height: 170px !important; display: block; }
.terms { margin-top: 16px; padding: 15px 18px; border-radius: 16px; background: var(--panel); border: 1px solid var(--line); }
.terms h3 { font-size: 24px; }
.terms ul { list-style: none; display: grid; grid-template-columns: 1fr 1fr; gap: 7px 22px; margin-top: 8px; }
.terms li { display: flex; gap: 7px; font-size: 10.5px; line-height: 1.4; color: var(--muted); }
.terms .ico { color: var(--gold); margin-top: 2px; }
.closing { display: flex; justify-content: space-between; align-items: flex-end; margin-top: auto; }
`;

function renderDocument(assets) {
  const pages = [
    coverPage(assets),
    introPage(assets),
    packagesPage(assets),
    ratesPage(assets),
    ...hotelPages(assets),
    experiencesPage(assets),
    reservePage(assets),
  ];
  const total = pages.length;
  const numbered = pages.map((html, i) =>
    i === 0 ? html : html.replace(/<\/section>$/, `${footer(i + 1, total)}</section>`),
  );

  return documentShell({
    title: 'Car Fest 2K26 · Propuesta de hospedaje',
    css: CSS,
    body: numbered.join('\n'),
  });
}

async function main() {
  const assets = await loadAssets();
  const { htmlFile, kb } = printPdf({
    html: renderDocument(assets),
    outFile: OUT_FILE,
    workName: 'carfest-propuesta',
  });
  console.log(`PDF listo: ${path.relative(ROOT, OUT_FILE)} (${kb} KB)`);
  console.log(`HTML de trabajo: ${htmlFile}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
