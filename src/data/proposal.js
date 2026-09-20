// Paquetes y cálculos de la propuesta de hospedaje para clientes.
// Todo sale de los precios públicos de lodging.js: aquí no hay costos de
// agencia ni márgenes, y nunca debe haberlos (este código llega al navegador).
//
// Un paquete = una habitación por N noches + extras que se cobran una sola vez
// (por ejemplo, el paseo en Barco Pirata). Los montos se manejan como mapas
// por moneda, { USD: 215, MXN: 1400 }, porque Peñasco del Sol cobra en dólares.

import { activities, hotels } from './lodging.js';

// Noches confirmadas con todos los hoteles (2026-09-15): viernes 25 y sábado 26.
export const STAY_NIGHTS = {
  dates: 'viernes 25 y sábado 26 de septiembre',
  short: '25 y 26 sep',
  single: '25 o 26 sep',
};

export const proposalPackages = [
  {
    id: 'recomendado',
    tier: 'Recomendado',
    featured: true,
    name: 'Car Fest Recomendado',
    hotel: 'hotel-playa-inn',
    room: 'Habitación doble',
    perks: ['Alberca central y jardines, cómodo para grupos'],
  },
  {
    id: 'economico',
    tier: 'Económico',
    name: 'Escapada Económica',
    hotel: 'hotel-vista-marina',
    room: 'Habitación doble',
    perks: ['Vista al mar, a un paso del centro'],
  },
  {
    id: 'familiar',
    tier: 'Familiar',
    name: 'Familia en la Playa',
    hotel: 'mannys-beach-club',
    room: 'Habitación doble + sofá cama',
    perks: ['Beach club frente al mar'],
    extras: [
      { activity: 'barco-pirata', package: 'cena-barra-libre', qty: 2 },
      { activity: 'barco-pirata', package: 'ninos', qty: 2 },
    ],
    extrasLabel: 'Barco Pirata: 2 adultos con cena y barra libre + 2 niños',
  },
  {
    id: 'premium',
    tier: 'Premium',
    name: 'Premium Frente al Mar',
    hotel: 'hotel-penasco-del-sol',
    room: 'Habitación de lujo',
    perks: ['Desayuno e impuestos incluidos'],
    extras: [{ activity: 'barco-pirata', package: 'cena-barra-libre', qty: 2 }],
    extrasLabel: 'Barco Pirata: 2 adultos con cena y barra libre',
  },
];

const CURRENCIES = ['USD', 'MXN'];

const formatters = {
  MXN: new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }),
  USD: new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'code',
    maximumFractionDigits: 0,
  }),
};

export const formatAmount = (amount, currency = 'MXN') => formatters[currency].format(amount);

// Partes formateadas en orden fijo: ['USD 215', '$1,400'].
export const moneyParts = (money) =>
  CURRENCIES.filter((c) => money?.[c]).map((c) => ({ currency: c, text: formatAmount(money[c], c) }));

export const formatMoney = (money) => moneyParts(money).map((p) => p.text).join(' + ');

const addMoney = (money, currency, amount) => ({
  ...money,
  [currency]: (money[currency] ?? 0) + amount,
});

export function findRoom(hotelSlug, roomType) {
  const hotel = hotels.find((h) => h.slug === hotelSlug);
  const room = hotel?.rooms.find((r) => r.type === roomType);
  if (!room) throw new Error(`No existe "${roomType}" en ${hotelSlug}`);
  return { hotel, room };
}

export function findActivityPackage(activitySlug, packageId) {
  const activity = activities.find((a) => a.slug === activitySlug);
  const item = activity?.packages?.find((p) => p.id === packageId);
  if (!item) throw new Error(`No existe el paquete "${packageId}" en ${activitySlug}`);
  return { activity, item };
}

// "2 a 4 personas" -> 4, "4 personas + niños" -> 4.
export const maxGuests = (capacity) =>
  Math.max(...(String(capacity).match(/\d+/g) ?? ['1']).map(Number));

export function quoteRoom(room, nights) {
  const currency = room.currency ?? 'MXN';
  return {
    price: { [currency]: room.price * nights },
    strike: room.priceStrike > room.price ? { [currency]: room.priceStrike * nights } : null,
  };
}

export function perGuestPerNight(room) {
  return { [room.currency ?? 'MXN']: room.price / maxGuests(room.capacity) };
}

export function quotePackage(pkg, nights) {
  const { room } = findRoom(pkg.hotel, pkg.room);
  const stay = quoteRoom(room, nights);
  let price = stay.price;
  let strike = stay.strike;
  for (const extra of pkg.extras ?? []) {
    const { item } = findActivityPackage(extra.activity, extra.package);
    const amount = item.price * extra.qty;
    price = addMoney(price, item.currency ?? 'MXN', amount);
    if (strike) strike = addMoney(strike, item.currency ?? 'MXN', amount);
  }
  return { price, strike };
}

export function savings({ price, strike }) {
  if (!strike) return null;
  const out = {};
  for (const c of CURRENCIES) {
    const diff = (strike[c] ?? 0) - (price[c] ?? 0);
    if (diff > 0) out[c] = diff;
  }
  return Object.keys(out).length ? out : null;
}
