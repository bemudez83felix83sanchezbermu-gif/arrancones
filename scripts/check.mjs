/**
 * Comprobaciones de las reglas del evento y de la lógica del panel.
 * Uso: npm run check
 */
import assert from 'node:assert/strict';
import {
  EMPTY_FILTERS,
  filterParticipants,
  sortParticipants,
  summarize,
  byCategory,
  byCity,
  byDay,
  byEventDay,
  byStatus,
  uniqueStates,
} from '../src/lib/adminData.js';
import { participantsToCsv } from '../src/lib/csv.js';
import {
  validateParticipant,
  normalizeSocial,
  socialLink,
  socialLabel,
} from '../shared/participants.js';
import {
  ESTADOS,
  ESTADO_OTRO,
  municipiosDe,
  esEstadoValido,
} from '../shared/mexico.js';

const row = (id, over = {}) => ({
  id,
  pilot_name: `Piloto ${id}`,
  copilot_name: null,
  category: 'car_show',
  vehicle_name: `Auto ${id}`,
  phone: '6381234567',
  state: 'Sonora',
  city: 'Puerto Peñasco',
  social: null,
  status: 'pendiente',
  notes: null,
  created_at: '2026-08-10T18:00:00.000Z',
  updated_at: '2026-08-10T18:00:00.000Z',
  ...over,
});

const rows = [
  row(1, { category: 'drift', pilot_name: 'Ana Márquez', city: 'Hermosillo' }),
  row(2, { category: 'car_show', copilot_name: 'Luis Soto', status: 'confirmado' }),
  row(3, {
    category: 'arrancones',
    pilot_name: 'Beto Ruiz',
    status: 'confirmado',
    state: 'Baja California',
    city: 'Mexicali',
    created_at: '2026-08-12T18:00:00.000Z',
  }),
  row(4, { category: 'arrancones', status: 'cancelado', city: 'Caborca' }),
  row(5, {
    category: 'car_show',
    copilot_name: 'Sara Lim',
    city: 'Hermosillo',
    created_at: '2026-08-14T18:00:00.000Z',
  }),
];

// Totales: cancelados fuera de métricas operativas.
const stats = summarize(rows);
assert.equal(stats.total, 5);
assert.equal(stats.vehiculos, 4, 'el cancelado no ocupa lugar');
assert.equal(stats.personas, 6, '4 pilotos activos + 2 copilotos');
assert.equal(stats.copilotos, 2);
assert.equal(stats.cuotas, 250 + 250 + 500, 'drift no paga y el cancelado no suma');
assert.equal(stats.ciudades, 3, 'Hermosillo, Puerto Peñasco y Mexicali');
assert.equal(stats.estados, 2, 'Sonora y Baja California');

// Filtros
const f = (over) => filterParticipants(rows, { ...EMPTY_FILTERS, ...over });
assert.equal(f({ q: 'marquez' }).length, 1, 'búsqueda sin acentos');
assert.equal(f({ q: 'MÁRQUEZ' }).length, 1, 'búsqueda insensible a mayúsculas');
assert.equal(f({ q: '0003' }).length, 1, 'búsqueda por folio');
assert.equal(f({ q: '638' }).length, 5, 'búsqueda por teléfono');
assert.equal(f({ q: 'baja' }).length, 1, 'búsqueda por estado');
assert.equal(f({ categories: ['arrancones'] }).length, 2);
assert.equal(f({ statuses: ['confirmado'] }).length, 2);
assert.equal(f({ state: 'Sonora' }).length, 4, 'filtro por estado');
assert.equal(f({ state: 'Baja California' }).length, 1);
assert.equal(f({ city: 'hermosillo' }).length, 2, 'municipio insensible a mayúsculas');
assert.equal(f({ state: 'Sonora', city: 'Hermosillo' }).length, 2, 'estado + municipio');
assert.equal(f({ copilot: 'con' }).length, 2);
assert.equal(f({ copilot: 'sin' }).length, 3);
assert.equal(f({ from: '2026-08-12' }).length, 2, 'rango desde');
assert.equal(f({ to: '2026-08-10' }).length, 3, 'rango hasta');
assert.equal(
  f({ categories: ['car_show'], copilot: 'con', city: 'Hermosillo' }).length,
  1,
  'filtros combinados',
);

// Orden
const asc = sortParticipants(rows, 'pilot_name', 'asc').map((r) => r.pilot_name);
assert.deepEqual(asc.slice(0, 2), ['Ana Márquez', 'Beto Ruiz']);
assert.equal(sortParticipants(rows, 'created_at', 'desc')[0].id, 5);

// Agregados de reportes
const cats = byCategory(rows);
assert.deepEqual(
  cats.map((c) => c.count),
  [1, 2, 2],
);
assert.equal(cats[2].cuotas, 500, 'arrancones: solo el activo suma');
assert.equal(cats[1].personas, 4, 'car show: 2 pilotos + 2 copilotos');

const days = byDay(rows);
assert.equal(days.length, 5, 'serie diaria continua del 10 al 14');
assert.equal(
  days.reduce((s, d) => s + d.count, 0),
  5,
);

const cities = byCity(rows);
assert.equal(cities[0].city, 'Hermosillo, Sonora', 'la etiqueta incluye el estado');
assert.equal(cities[0].total, 2);
assert.equal(
  cities.reduce((s, c) => s + c.total, 0),
  4,
  'cancelado excluido de procedencia',
);
assert.deepEqual(uniqueStates(rows), ['Baja California', 'Sonora']);

const eventDays = byEventDay(rows);
assert.equal(eventDays[0].personas, 5, 'sábado: drift + car show');
assert.equal(eventDays[1].vehiculos, 1, 'domingo: solo arrancones activos');

assert.deepEqual(
  byStatus(rows).map((s) => s.count),
  [2, 2, 1],
);

// Reglas de negocio
assert.ok(!validateParticipant({ ...row(9), category: 'arrancones', copilot_name: 'Alguien' }).ok);
assert.ok(validateParticipant({ ...row(9), category: 'car_show', copilot_name: 'Alguien' }).ok);
assert.ok(!validateParticipant({ ...row(9), phone: '123' }).ok);
assert.ok(!validateParticipant({ ...row(9), pilot_name: 'Al' }).ok);
assert.equal(validateParticipant({ status: 'confirmado' }, { partial: true }).ok, true);
// El formulario público no manda status ni notes: no deben exigirse.
const publico = {
  category: 'car_show',
  pilot_name: 'Juan Pérez',
  vehicle_name: 'Cherokee',
  phone: '6381104342',
  state: 'Sonora',
  city: 'Puerto Peñasco',
  copilot_name: '',
  social: '',
};
assert.ok(validateParticipant(publico).ok, 'alta pública sin status ni notes');
assert.equal(validateParticipant({ ...publico, status: 'raro' }).errors.status, 'Estado inválido.');

// Estado y municipio
assert.equal(ESTADOS.length, 33, '32 estados + fuera de México');
assert.equal(municipiosDe('Sonora').length, 72);
assert.ok(municipiosDe('Sonora').includes('Puerto Peñasco'));
assert.equal(municipiosDe(ESTADO_OTRO).length, 0, 'fuera de México no tiene catálogo');
assert.ok(esEstadoValido('Sonora') && esEstadoValido(ESTADO_OTRO) && !esEstadoValido('Texas'));
assert.equal(validateParticipant({ ...row(9), state: 'Texas' }).errors.state, 'Selecciona tu estado.');
assert.ok(validateParticipant({ ...row(9), state: ESTADO_OTRO, city: 'Phoenix, Arizona' }).ok);
assert.ok(!validateParticipant({ ...row(9), state: '' }).ok, 'el estado es obligatorio');

// Red social: usuario o enlace directo
assert.equal(normalizeSocial('instagram.com/alp_racing'), 'https://instagram.com/alp_racing');
assert.equal(normalizeSocial('https://facebook.com/alp'), 'https://facebook.com/alp');
assert.equal(normalizeSocial('@alp_racing'), '@alp_racing');
assert.equal(normalizeSocial('  '), '');
assert.equal(socialLink('@alp_racing'), null, 'un usuario no es enlace');
assert.equal(socialLink('https://x.com/alp'), 'https://x.com/alp');
assert.equal(socialLabel('https://instagram.com/alp/'), 'instagram.com/alp');
assert.equal(
  validateParticipant({ ...row(9), social: 'tiktok.com/@alp' }).value.social,
  'https://tiktok.com/@alp',
  'guarda el enlace normalizado',
);
assert.equal(validateParticipant({ ...row(9), social: '@alp' }).value.social, '@alp');
assert.equal(validateParticipant({ ...row(9), social: '' }).value.social, null);

// CSV
const csv = participantsToCsv(rows.slice(0, 3));
const lines = csv.split('\r\n');
assert.equal(lines.length, 4);
assert.ok(lines[0].startsWith('\ufeffFolio;Piloto;Copiloto'));
assert.ok(lines[0].includes('Estado;Municipio'), 'columnas de estado y municipio');
assert.ok(lines[0].includes('Estatus'), 'el estatus del registro no se llama Estado');
assert.ok(lines[1].includes('CF-0001'));
assert.ok(lines[3].includes('Baja California;Mexicali'));

console.log('OK · 53 comprobaciones: filtros, estado/municipio, red social, agregados y CSV');
