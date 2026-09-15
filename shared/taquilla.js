/**
 * Dominio de la taquilla del evento: métodos de pago, validación de ventas y
 * tipos de entrada, y los agregados del corte de caja.
 * Lo comparten la API (/api/taquilla/*), el panel /admin/taquilla y `npm run check`.
 */

/** El evento es en Puerto Peñasco; Sonora no cambia de horario en todo el año. */
export const EVENT_TIMEZONE = 'America/Hermosillo';

export const PAYMENT_METHODS = {
  efectivo: { id: 'efectivo', label: 'Efectivo', color: '#22C55E' },
  tarjeta: { id: 'tarjeta', label: 'Tarjeta', color: '#3B82E8' },
  transferencia: { id: 'transferencia', label: 'Transferencia', color: '#C2891A' },
  cortesia: { id: 'cortesia', label: 'Cortesía', color: '#8A8A8A' },
};

export const PAYMENT_METHOD_IDS = Object.keys(PAYMENT_METHODS);

/** Los que elige el taquillero; cortesía se asigna sola cuando el total es $0. */
export const PAID_METHOD_IDS = ['efectivo', 'tarjeta', 'transferencia'];

export const paymentLabel = (id) => PAYMENT_METHODS[id]?.label ?? id;

export const MAX_PEOPLE_PER_SALE = 200;
export const MAX_TICKET_PRICE = 100000;
const NAME_MAX = 40;

const clean = (v) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : '');
const round2 = (n) => Math.round(n * 100) / 100;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Monto redondeado a centavos, o null si no es un número válido. Acepta "$1,500". */
export function parseMoney(value) {
  if (value === '' || value === null || value === undefined) return null;
  const n = typeof value === 'number' ? value : Number(String(value).replace(/[$,\s]/g, ''));
  return Number.isFinite(n) ? round2(n) : null;
}

export const formatPesos = (n) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n ?? 0);

/** Filas de la BD a números: el driver regresa bigint y numeric como texto. */
export const asTicketType = (row) =>
  row
    ? {
        ...row,
        id: Number(row.id),
        price: Number(row.price),
        sort_order: Number(row.sort_order),
      }
    : row;

export const asSale = (row) =>
  row
    ? {
        ...row,
        id: Number(row.id),
        people: Number(row.people),
        total: Number(row.total),
        created_by: row.created_by == null ? null : Number(row.created_by),
        voided_by: row.voided_by == null ? null : Number(row.voided_by),
        items: (row.items ?? []).map((item) => ({
          ...item,
          ticket_type_id: item.ticket_type_id == null ? null : Number(item.ticket_type_id),
          unit_price: Number(item.unit_price),
          quantity: Number(item.quantity),
        })),
      }
    : row;

/** Nombre, precio, activo y orden de un tipo de entrada. */
export function validateTicketType(input = {}, { partial = false } = {}) {
  const errors = {};
  const value = {};
  const has = (k) => !partial || input[k] !== undefined;

  if (has('name')) {
    const name = clean(input.name);
    if (name.length < 2) errors.name = 'Escribe el nombre de la entrada.';
    else if (name.length > NAME_MAX) errors.name = `Máximo ${NAME_MAX} caracteres.`;
    else value.name = name;
  }

  if (has('price')) {
    const price = parseMoney(input.price);
    if (price === null || price < 0) errors.price = 'Escribe un precio válido (0 para cortesía).';
    else if (price > MAX_TICKET_PRICE) errors.price = 'Ese precio es demasiado alto.';
    else value.price = price;
  }

  if (input.active !== undefined) value.active = Boolean(input.active);

  if (input.sort_order !== undefined && input.sort_order !== '') {
    const order = Number(input.sort_order);
    if (!Number.isInteger(order) || order < 0 || order > 999) errors.sort_order = 'Orden inválido.';
    else value.sort_order = order;
  }

  return { errors, value, ok: Object.keys(errors).length === 0 };
}

/**
 * Valida una venta de taquilla. El precio unitario es el que cobró el taquillero
 * en ese momento (una venta guardada sin señal puede subirse después de un cambio
 * de precio y debe cuadrar con el dinero de la caja).
 */
export function validateSale(input = {}, { now = new Date() } = {}) {
  const errors = {};
  const value = {};

  const clientId = clean(input.client_id);
  if (!UUID.test(clientId)) errors.client_id = 'La venta no tiene identificador.';
  else value.client_id = clientId.toLowerCase();

  const items = [];
  const seen = new Set();
  for (const raw of Array.isArray(input.items) ? input.items : []) {
    const quantity = Number(raw?.quantity);
    const unitPrice = parseMoney(raw?.unit_price);
    const name = clean(raw?.name);
    const typeId = raw?.ticket_type_id == null ? null : Number(raw.ticket_type_id);
    const invalid =
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      name.length < 1 ||
      name.length > NAME_MAX ||
      unitPrice === null ||
      unitPrice < 0 ||
      unitPrice > MAX_TICKET_PRICE ||
      (typeId !== null && (!Number.isInteger(typeId) || typeId <= 0));
    if (invalid) {
      errors.items = 'Hay una entrada con datos inválidos.';
      break;
    }
    const key = typeId ?? `nombre:${name.toLowerCase()}`;
    if (seen.has(key)) {
      errors.items = 'Una entrada aparece dos veces en la misma venta.';
      break;
    }
    seen.add(key);
    items.push({ ticket_type_id: typeId, name, unit_price: unitPrice, quantity });
  }
  if (!errors.items && !items.length) errors.items = 'Agrega al menos una entrada.';

  const people = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = round2(items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0));
  if (!errors.items && people > MAX_PEOPLE_PER_SALE) {
    errors.items = `Máximo ${MAX_PEOPLE_PER_SALE} personas por venta.`;
  }
  value.items = items;
  value.people = people;
  value.total = total;

  const method = clean(input.payment_method);
  if (total === 0) value.payment_method = 'cortesia';
  else if (!PAID_METHOD_IDS.includes(method)) {
    errors.payment_method = 'Elige cómo pagó: efectivo, tarjeta o transferencia.';
  } else value.payment_method = method;

  const cashier = clean(input.cashier);
  if (cashier.length > NAME_MAX) errors.cashier = `Máximo ${NAME_MAX} caracteres.`;
  else value.cashier = cashier || null;

  const notes = typeof input.notes === 'string' ? input.notes.trim() : '';
  if (notes.length > 200) errors.notes = 'Máximo 200 caracteres.';
  else value.notes = notes || null;

  // Se respeta la hora real de la venta (las guardadas sin señal llegan tarde),
  // salvo que el reloj del teléfono esté claramente mal.
  const soldAt = input.sold_at ? new Date(input.sold_at) : null;
  const nowMs = now.getTime();
  const plausible =
    soldAt &&
    !Number.isNaN(soldAt.getTime()) &&
    soldAt.getTime() <= nowMs + 10 * 60 * 1000 &&
    soldAt.getTime() >= nowMs - 30 * 24 * 60 * 60 * 1000;
  value.sold_at = (plausible ? soldAt : now).toISOString();

  return { errors, value, ok: Object.keys(errors).length === 0 };
}

/* ---------- Corte de caja ---------- */

/** Día de la venta en hora de Puerto Peñasco: 2026-09-26. */
export const saleDayKey = (value) =>
  new Date(value).toLocaleDateString('en-CA', { timeZone: EVENT_TIMEZONE });

const hourFormatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  hourCycle: 'h23',
  timeZone: EVENT_TIMEZONE,
});

export const saleHour = (value) => Number(hourFormatter.format(new Date(value)));

export const formatSaleTime = (value) =>
  new Date(value).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: EVENT_TIMEZONE,
  });

export const formatSaleDay = (key) =>
  new Date(`${key}T12:00:00`).toLocaleDateString('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

export const isVoided = (sale) => Boolean(sale.voided_at);

/** Folio legible de una venta ya registrada en el servidor. */
export const saleFolio = (id) => `T-${String(id).padStart(4, '0')}`;

export const describeItems = (sale) =>
  (sale.items ?? []).map((item) => `${item.quantity} × ${item.name}`).join(' · ');

/** Días con ventas, ordenados, para los filtros del corte. */
export const saleDays = (sales) => [...new Set(sales.map((sale) => saleDayKey(sale.sold_at)))].sort();

const collator = new Intl.Collator('es-MX', { sensitivity: 'base' });

/**
 * Totales del corte. Las ventas anuladas no suman personas ni dinero; se
 * reportan aparte. `day` filtra a un día del evento (YYYY-MM-DD).
 */
export function summarizeSales(sales, { day = '' } = {}) {
  const scoped = day ? sales.filter((sale) => saleDayKey(sale.sold_at) === day) : sales;
  const active = scoped.filter((sale) => !isVoided(sale));
  const voided = scoped.filter(isVoided);
  const sum = (list, key) => round2(list.reduce((acc, sale) => acc + Number(sale[key] || 0), 0));

  const byMethod = PAYMENT_METHOD_IDS.map((id) => {
    const list = active.filter((sale) => sale.payment_method === id);
    return {
      id,
      label: PAYMENT_METHODS[id].label,
      color: PAYMENT_METHODS[id].color,
      ventas: list.length,
      personas: sum(list, 'people'),
      total: sum(list, 'total'),
    };
  });

  const types = new Map();
  for (const sale of active) {
    for (const item of sale.items ?? []) {
      const key = item.name.toLowerCase();
      if (!types.has(key)) types.set(key, { label: item.name, personas: 0, total: 0 });
      const entry = types.get(key);
      entry.personas += item.quantity;
      entry.total = round2(entry.total + item.unit_price * item.quantity);
    }
  }
  const byType = [...types.values()].sort(
    (a, b) => b.personas - a.personas || collator.compare(a.label, b.label),
  );

  const cashiers = new Map();
  for (const sale of active) {
    const label = sale.cashier || 'Sin nombre';
    if (!cashiers.has(label)) {
      cashiers.set(label, { label, ventas: 0, personas: 0, efectivo: 0, total: 0 });
    }
    const entry = cashiers.get(label);
    entry.ventas += 1;
    entry.personas += sale.people;
    entry.total = round2(entry.total + sale.total);
    if (sale.payment_method === 'efectivo') entry.efectivo = round2(entry.efectivo + sale.total);
  }
  const byCashier = [...cashiers.values()].sort((a, b) => b.total - a.total);

  const hours = new Map();
  for (const sale of active) {
    const hour = saleHour(sale.sold_at);
    hours.set(hour, (hours.get(hour) ?? 0) + sale.people);
  }
  const hourKeys = [...hours.keys()].sort((a, b) => a - b);
  const byHour = [];
  if (hourKeys.length) {
    for (let h = hourKeys[0]; h <= hourKeys[hourKeys.length - 1]; h += 1) {
      byHour.push({ hour: h, label: `${String(h).padStart(2, '0')}:00`, personas: hours.get(h) ?? 0 });
    }
  }

  const personas = sum(active, 'people');
  const total = sum(active, 'total');
  const pagadas = active.filter((sale) => sale.total > 0);

  return {
    ventas: active.length,
    personas,
    total,
    efectivo: byMethod.find((m) => m.id === 'efectivo').total,
    cortesias: byMethod.find((m) => m.id === 'cortesia').personas,
    promedio: pagadas.length ? round2(total / pagadas.length) : 0,
    anuladas: voided.length,
    totalAnulado: sum(voided, 'total'),
    byMethod,
    byType,
    byCashier,
    byHour,
  };
}
