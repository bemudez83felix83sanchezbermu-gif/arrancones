/**
 * Comprobaciones de la taquilla: validación de ventas y tipos de entrada, y el
 * corte de caja (anuladas, cortesías y días en hora de Puerto Peñasco).
 * Uso: npm run check:taquilla
 */
import assert from 'node:assert/strict';
import {
  parseMoney,
  saleDayKey,
  saleDays,
  saleFolio,
  summarizeSales,
  validateSale,
  validateTicketType,
} from '../shared/taquilla.js';

let checks = 0;
const check = (fn) => {
  fn();
  checks += 1;
};

const uuid = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const general = (quantity) => ({ ticket_type_id: 1, name: 'General', unit_price: 150, quantity });
const now = new Date('2026-09-26T20:00:00.000Z');
const draft = (over = {}) => ({
  client_id: uuid(1),
  payment_method: 'efectivo',
  items: [general(2)],
  sold_at: '2026-09-26T19:30:00.000Z',
  ...over,
});

// Montos y tipos de entrada
check(() => assert.equal(parseMoney('$1,500'), 1500, 'acepta monto con signo y comas'));
check(() => assert.equal(parseMoney('abc'), null));
check(() => assert.equal(validateTicketType({ name: 'General', price: '150' }).value.price, 150));
check(() => assert.ok(validateTicketType({ name: 'Cortesía', price: 0 }).ok, 'precio 0 es cortesía'));
check(() => assert.ok(validateTicketType({ name: 'General', price: -1 }).errors.price));
check(() => assert.ok(!validateTicketType({ name: 'G', price: 10 }).ok, 'nombre muy corto'));
check(() => assert.ok(validateTicketType({ active: false }, { partial: true }).ok, 'solo activar/ocultar'));

// Ventas
const ok = validateSale(draft(), { now });
check(() => assert.ok(ok.ok));
check(() => assert.equal(ok.value.people, 2));
check(() => assert.equal(ok.value.total, 300));
check(() =>
  assert.equal(ok.value.sold_at, '2026-09-26T19:30:00.000Z', 'respeta la hora de venta sin señal'),
);
check(() =>
  assert.equal(
    validateSale(
      draft({ items: [{ ticket_type_id: 3, name: 'Cortesía', unit_price: 0, quantity: 3 }] }),
      { now },
    ).value.payment_method,
    'cortesia',
    'total $0 siempre es cortesía',
  ),
);
check(() => assert.ok(validateSale(draft({ payment_method: 'cortesia' }), { now }).errors.payment_method));
check(() => assert.ok(validateSale(draft({ payment_method: 'bitcoin' }), { now }).errors.payment_method));
check(() => assert.ok(validateSale(draft({ items: [] }), { now }).errors.items));
check(() => assert.ok(validateSale(draft({ items: [general(0)] }), { now }).errors.items, 'cantidad 0'));
check(() =>
  assert.ok(
    validateSale(draft({ items: [general(1), general(2)] }), { now }).errors.items,
    'tipo repetido',
  ),
);
check(() => assert.ok(validateSale(draft({ items: [general(201)] }), { now }).errors.items, 'tope por venta'));
check(() => assert.ok(validateSale(draft({ client_id: 'x' }), { now }).errors.client_id));
check(() =>
  assert.equal(
    validateSale(draft({ sold_at: '2026-09-26T23:00:00.000Z' }), { now }).value.sold_at,
    now.toISOString(),
    'una hora en el futuro se corrige a la del servidor',
  ),
);

// Corte de caja
const sale = (id, over = {}) => ({
  id,
  client_id: uuid(id),
  cashier: 'Caja 1',
  payment_method: 'efectivo',
  people: 2,
  total: 300,
  voided_at: null,
  sold_at: '2026-09-26T19:30:00.000Z',
  items: [general(2)],
  ...over,
});

const ventas = [
  sale(1),
  sale(2, {
    cashier: 'Caja 2',
    payment_method: 'tarjeta',
    total: 200,
    items: [general(1), { ticket_type_id: 2, name: 'Niños', unit_price: 50, quantity: 1 }],
  }),
  sale(3, {
    payment_method: 'cortesia',
    people: 3,
    total: 0,
    items: [{ ticket_type_id: 3, name: 'Cortesía', unit_price: 0, quantity: 3 }],
  }),
  sale(4, { voided_at: '2026-09-26T20:00:00.000Z' }),
  // 22:30 del sábado en Peñasco = 05:30 UTC del domingo.
  sale(5, { sold_at: '2026-09-27T05:30:00.000Z' }),
  sale(6, { sold_at: '2026-09-27T18:00:00.000Z', people: 1, total: 150, items: [general(1)] }),
];

const corte = summarizeSales(ventas);
check(() => assert.equal(corte.personas, 10, 'la anulada no cuenta'));
check(() => assert.equal(corte.total, 950));
check(() => assert.equal(corte.efectivo, 750));
check(() => assert.equal(corte.ventas, 5));
check(() => assert.equal(corte.cortesias, 3));
check(() => assert.equal(corte.promedio, 237.5, 'el promedio ignora cortesías'));
check(() => assert.equal(corte.anuladas, 1));
check(() => assert.equal(corte.totalAnulado, 300));
check(() =>
  assert.deepEqual(
    corte.byType.map((t) => [t.label, t.personas, t.total]),
    [
      ['General', 6, 900],
      ['Cortesía', 3, 0],
      ['Niños', 1, 50],
    ],
  ),
);
check(() =>
  assert.deepEqual(
    corte.byCashier.map((c) => [c.label, c.efectivo, c.total]),
    [
      ['Caja 1', 750, 750],
      ['Caja 2', 0, 200],
    ],
  ),
);
check(() => assert.equal(saleDayKey('2026-09-27T05:30:00.000Z'), '2026-09-26', 'día en hora de Peñasco'));
check(() => assert.deepEqual(saleDays(ventas), ['2026-09-26', '2026-09-27']));

const sabado = summarizeSales(ventas, { day: '2026-09-26' });
check(() => assert.equal(sabado.personas, 9));
check(() => assert.equal(sabado.total, 800));
check(() => assert.equal(sabado.byHour.length, 11, 'serie continua de 12:00 a 22:00'));
check(() => assert.equal(sabado.byHour[0].personas, 7));
check(() => assert.equal(summarizeSales(ventas, { day: '2026-09-27' }).total, 150));
check(() => assert.equal(saleFolio(7), 'T-0007'));

console.log(`OK · ${checks} comprobaciones de taquilla: validación, cortesías, anuladas y corte por día`);
