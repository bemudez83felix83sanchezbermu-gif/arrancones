import { CATEGORIES, STATUSES, folio, formatPhone } from '../../shared/participants.js';
import { formatDateTime } from './adminData.js';

const COLUMNS = [
  ['Folio', (row) => folio(row.id)],
  ['Piloto', (row) => row.pilot_name],
  ['Copiloto', (row) => row.copilot_name ?? ''],
  ['Categoría', (row) => CATEGORIES[row.category].label],
  ['Vehículo', (row) => row.vehicle_name],
  ['Estado', (row) => row.state ?? ''],
  ['Municipio', (row) => row.city],
  ['WhatsApp', (row) => formatPhone(row.phone)],
  ['Red social', (row) => row.social ?? ''],
  ['Estatus', (row) => STATUSES[row.status].label],
  ['Cuota', (row) => CATEGORIES[row.category].fee],
  ['Personas', (row) => (row.copilot_name ? 2 : 1)],
  ['Notas', (row) => row.notes ?? ''],
  ['Registrado', (row) => formatDateTime(row.created_at)],
];

const escape = (value) => {
  const text = String(value ?? '');
  return /[";\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export function participantsToCsv(rows) {
  const header = COLUMNS.map(([label]) => label).join(';');
  const body = rows.map((row) => COLUMNS.map(([, get]) => escape(get(row))).join(';'));
  // BOM + separador ';' para que Excel en español lo abra en columnas.
  return `﻿${[header, ...body].join('\r\n')}`;
}

export function downloadCsv(rows, name = 'participantes') {
  const blob = new Blob([participantsToCsv(rows)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${name}-${new Date().toLocaleDateString('en-CA')}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
