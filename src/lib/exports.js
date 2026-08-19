import {
  CATEGORIES,
  STATUSES,
  folio,
  formatPhone,
  raceClassLabel,
} from '../../shared/participants.js';
import { formatDateTime } from './adminData.js';

/**
 * Definición única de columnas para exportar (Excel, PDF y CSV).
 * `width` = ancho aproximado en caracteres para Excel; `pdfWidth` = ancho relativo para PDF.
 */
const COLUMNS = [
  { label: 'Folio', width: 9, pdfWidth: 40, get: (row) => folio(row.id) },
  { label: 'Piloto', width: 26, pdfWidth: 90, get: (row) => row.pilot_name },
  { label: 'Copiloto', width: 22, pdfWidth: 80, get: (row) => row.copilot_name ?? '' },
  { label: 'Categoría', width: 12, pdfWidth: 55, get: (row) => CATEGORIES[row.category].label },
  {
    label: 'Clase',
    width: 18,
    pdfWidth: 65,
    get: (row) => (row.race_class ? raceClassLabel(row.race_class) : ''),
  },
  { label: 'Vehículo', width: 22, pdfWidth: 90, get: (row) => row.vehicle_name },
  { label: 'Estado', width: 18, pdfWidth: 70, get: (row) => row.state ?? '' },
  { label: 'Municipio', width: 20, pdfWidth: 75, get: (row) => row.city },
  { label: 'WhatsApp', width: 16, pdfWidth: 75, get: (row) => formatPhone(row.phone) },
  { label: 'Red social', width: 28, pdfWidth: 90, get: (row) => row.social ?? '' },
  { label: 'Estatus', width: 12, pdfWidth: 55, get: (row) => STATUSES[row.status].label },
  { label: 'Cuota', width: 10, pdfWidth: 45, get: (row) => CATEGORIES[row.category].fee, numeric: true },
  { label: 'Personas', width: 10, pdfWidth: 45, get: (row) => (row.copilot_name ? 2 : 1), numeric: true },
  { label: 'Notas', width: 30, pdfWidth: 100, get: (row) => row.notes ?? '' },
  { label: 'Registrado', width: 20, pdfWidth: 85, get: (row) => formatDateTime(row.created_at) },
];

const fileStamp = () => new Date().toLocaleDateString('en-CA');

const triggerDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

/* ---------- Excel (.xlsx) ---------- */

export async function downloadExcel(rows, name = 'participantes') {
  const XLSX = await import('xlsx');

  const header = COLUMNS.map((column) => column.label);
  const body = rows.map((row) =>
    COLUMNS.map((column) => {
      const value = column.get(row);
      if (value === null || value === undefined || value === '') return '';
      return column.numeric ? Number(value) : value;
    }),
  );

  const sheet = XLSX.utils.aoa_to_sheet([header, ...body]);
  sheet['!cols'] = COLUMNS.map((column) => ({ wch: column.width }));
  sheet['!autofilter'] = { ref: XLSX.utils.encode_range({
    s: { c: 0, r: 0 },
    e: { c: COLUMNS.length - 1, r: body.length },
  }) };
  sheet['!freeze'] = { xSplit: 0, ySplit: 1 };

  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, 'Participantes');

  const buffer = XLSX.write(book, { type: 'array', bookType: 'xlsx' });
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  triggerDownload(blob, `${name}-${fileStamp()}.xlsx`);
}

/* ---------- PDF ---------- */

export async function downloadPdf(rows, name = 'participantes') {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Car Fest 2K26 · Registro de participantes', 32, 40);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(90);
  const exported = new Date().toLocaleString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`${rows.length} registro${rows.length === 1 ? '' : 's'} · Exportado ${exported}`, 32, 56);
  doc.setTextColor(0);

  autoTable(doc, {
    startY: 72,
    head: [COLUMNS.map((column) => column.label)],
    body: rows.map((row) => COLUMNS.map((column) => String(column.get(row) ?? ''))),
    styles: { fontSize: 7, cellPadding: 3, overflow: 'linebreak', valign: 'middle' },
    headStyles: {
      fillColor: [225, 6, 0],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    alternateRowStyles: { fillColor: [246, 246, 246] },
    columnStyles: COLUMNS.reduce((acc, column, index) => {
      acc[index] = { cellWidth: column.pdfWidth };
      if (column.numeric) acc[index].halign = 'right';
      return acc;
    }, {}),
    margin: { left: 20, right: 20 },
    didDrawPage: (data) => {
      const page = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.text(
        `Página ${data.pageNumber} de ${page}`,
        pageWidth - 32,
        doc.internal.pageSize.getHeight() - 16,
        { align: 'right' },
      );
    },
  });

  doc.save(`${name}-${fileStamp()}.pdf`);
}

/* ---------- CSV (compatibilidad, no expuesto en la UI) ---------- */

const escapeCsv = (value) => {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export function participantsToCsv(rows) {
  const header = COLUMNS.map((column) => column.label).join(',');
  const body = rows.map((row) => COLUMNS.map((column) => escapeCsv(column.get(row))).join(','));
  return `﻿${[header, ...body].join('\r\n')}`;
}

export function downloadCsv(rows, name = 'participantes') {
  const blob = new Blob([participantsToCsv(rows)], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `${name}-${fileStamp()}.csv`);
}
