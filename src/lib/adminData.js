import {
  CATEGORIES,
  CATEGORY_IDS,
  STATUSES,
  STATUS_IDS,
  categoryFee,
  normalizePhone,
} from '../../shared/participants.js';

/** Clave de día en hora local, comparable y ordenable: 2026-09-26. */
export const dayKey = (value) => new Date(value).toLocaleDateString('en-CA');

export const formatDate = (value) =>
  new Date(value).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

export const formatDateTime = (value) =>
  new Date(value).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

export const EMPTY_FILTERS = {
  q: '',
  categories: [],
  statuses: [],
  race_classes: [],
  state: '',
  city: '',
  copilot: 'todos', // todos | con | sin
  from: '',
  to: '',
};

export const hasActiveFilters = (f) =>
  Boolean(
    f.q.trim() ||
      f.categories.length ||
      f.statuses.length ||
      f.race_classes.length ||
      f.state ||
      f.city ||
      f.copilot !== 'todos' ||
      f.from ||
      f.to,
  );

const normalize = (value) =>
  String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');

export function filterParticipants(rows, filters) {
  const term = normalize(filters.q.trim());
  const digits = normalizePhone(filters.q);

  return rows.filter((row) => {
    if (filters.categories.length && !filters.categories.includes(row.category)) return false;
    if (filters.statuses.length && !filters.statuses.includes(row.status)) return false;
    if (
      filters.race_classes.length &&
      (row.category !== 'arrancones' || !filters.race_classes.includes(row.race_class))
    )
      return false;
    if (filters.state && row.state !== filters.state) return false;
    if (filters.city && normalize(row.city) !== normalize(filters.city)) return false;
    if (filters.copilot === 'con' && !row.copilot_name) return false;
    if (filters.copilot === 'sin' && row.copilot_name) return false;

    const day = dayKey(row.created_at);
    if (filters.from && day < filters.from) return false;
    if (filters.to && day > filters.to) return false;

    if (term) {
      const haystack = normalize(
        [row.pilot_name, row.copilot_name, row.vehicle_name, row.city, row.state, row.social, row.notes]
          .filter(Boolean)
          .join(' '),
      );
      const matchesText = haystack.includes(term);
      const matchesPhone = digits.length >= 3 && row.phone.includes(digits);
      const matchesFolio = digits.length > 0 && String(row.id).padStart(4, '0').includes(digits);
      if (!matchesText && !matchesPhone && !matchesFolio) return false;
    }
    return true;
  });
}

const collator = new Intl.Collator('es-MX', { sensitivity: 'base' });

export function sortParticipants(rows, key, direction) {
  const factor = direction === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    let result;
    switch (key) {
      case 'pilot_name':
      case 'vehicle_name':
      case 'city':
        result = collator.compare(a[key] ?? '', b[key] ?? '');
        break;
      case 'category':
        result = collator.compare(CATEGORIES[a.category].label, CATEGORIES[b.category].label);
        break;
      case 'status':
        result = STATUS_IDS.indexOf(a.status) - STATUS_IDS.indexOf(b.status);
        break;
      case 'created_at':
        result = new Date(a.created_at) - new Date(b.created_at);
        break;
      default:
        result = a.id - b.id;
    }
    return (result || a.id - b.id) * factor;
  });
}

export const uniqueStates = (rows) =>
  [...new Set(rows.map((row) => row.state).filter(Boolean))].sort(collator.compare);

export const uniqueCities = (rows) =>
  [...new Set(rows.map((row) => row.city.trim()).filter(Boolean))].sort(collator.compare);

/** Un cancelado ya no ocupa lugar ni cuota: se excluye de totales operativos. */
const isActive = (row) => row.status !== 'cancelado';

export function summarize(rows) {
  const active = rows.filter(isActive);
  return {
    total: rows.length,
    confirmados: rows.filter((row) => row.status === 'confirmado').length,
    pendientes: rows.filter((row) => row.status === 'pendiente').length,
    cancelados: rows.filter((row) => row.status === 'cancelado').length,
    vehiculos: active.length,
    copilotos: active.filter((row) => row.copilot_name).length,
    personas: active.reduce((sum, row) => sum + (row.copilot_name ? 2 : 1), 0),
    ciudades: uniqueCities(active).length,
    estados: uniqueStates(active).length,
    cuotas: active.reduce((sum, row) => sum + categoryFee(row.category), 0),
  };
}

export function byCategory(rows) {
  return CATEGORY_IDS.map((id) => {
    const all = rows.filter((row) => row.category === id);
    const active = all.filter(isActive);
    return {
      id,
      label: CATEGORIES[id].label,
      color: CATEGORIES[id].chart,
      day: CATEGORIES[id].day,
      count: all.length,
      confirmados: all.filter((row) => row.status === 'confirmado').length,
      pendientes: all.filter((row) => row.status === 'pendiente').length,
      cancelados: all.length - active.length,
      personas: active.reduce((sum, row) => sum + (row.copilot_name ? 2 : 1), 0),
      cuotas: active.length * CATEGORIES[id].fee,
    };
  });
}

export function byStatus(rows) {
  return STATUS_IDS.map((id) => ({
    id,
    label: STATUSES[id].label,
    count: rows.filter((row) => row.status === id).length,
  }));
}

/** Serie diaria continua entre el primer y el último registro (sin huecos). */
export function byDay(rows) {
  if (!rows.length) return [];
  const counts = new Map();
  for (const row of rows) {
    const key = dayKey(row.created_at);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const keys = [...counts.keys()].sort();
  const series = [];
  const cursor = new Date(`${keys[0]}T12:00:00`);
  const last = new Date(`${keys[keys.length - 1]}T12:00:00`);
  while (cursor <= last && series.length < 400) {
    const key = dayKey(cursor);
    series.push({ key, count: counts.get(key) ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  return series;
}

export function byCity(rows, limit = 8) {
  const cities = new Map();
  for (const row of rows.filter(isActive)) {
    const name = row.state ? `${row.city.trim()}, ${row.state}` : row.city.trim();
    if (!cities.has(name)) {
      cities.set(name, { city: name, total: 0, drift: 0, car_show: 0, arrancones: 0 });
    }
    const entry = cities.get(name);
    entry.total += 1;
    entry[row.category] += 1;
  }
  const sorted = [...cities.values()].sort((a, b) => b.total - a.total || collator.compare(a.city, b.city));
  if (sorted.length <= limit) return sorted;

  const top = sorted.slice(0, limit);
  const rest = sorted.slice(limit).reduce(
    (acc, entry) => ({
      city: `Otras ${sorted.length - limit} ciudades`,
      total: acc.total + entry.total,
      drift: acc.drift + entry.drift,
      car_show: acc.car_show + entry.car_show,
      arrancones: acc.arrancones + entry.arrancones,
    }),
    { city: '', total: 0, drift: 0, car_show: 0, arrancones: 0 },
  );
  return [...top, rest];
}

/** Carga por día de evento: el sábado corren drift y car show, el domingo arrancones. */
export function byEventDay(rows) {
  const active = rows.filter(isActive);
  const bucket = (ids) => {
    const list = active.filter((row) => ids.includes(row.category));
    return {
      vehiculos: list.length,
      personas: list.reduce((sum, row) => sum + (row.copilot_name ? 2 : 1), 0),
    };
  };
  return [
    { label: 'Sábado 26', detail: 'Drift y Car Show', ...bucket(['drift', 'car_show']) },
    { label: 'Domingo 27', detail: 'Arrancones', ...bucket(['arrancones']) },
  ];
}
