import { EVENT } from '../data/event.js';
import {
  EVENT_TIMEZONE,
  describeItems,
  formatSaleDay,
  formatSaleTime,
  isVoided,
  paymentLabel,
  saleDayKey,
  saleFolio,
  summarizeSales,
} from '../../shared/taquilla.js';
import { fileStamp, triggerDownload } from './exports.js';

const saleStatus = (sale) => {
  if (isVoided(sale)) return 'Anulada';
  if (sale.pending) return 'Por subir';
  return 'Válida';
};

/** Corte de taquilla en .xlsx: hoja "Corte" con totales y hoja "Ventas" con el detalle. */
export async function downloadTaquillaExcel(sales, { day = '' } = {}) {
  const XLSX = await import('xlsx');

  const stats = summarizeSales(sales, { day });
  const scoped = (day ? sales.filter((sale) => saleDayKey(sale.sold_at) === day) : [...sales]).sort(
    (a, b) => new Date(a.sold_at) - new Date(b.sold_at),
  );

  const generated = new Date().toLocaleString('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: EVENT_TIMEZONE,
  });

  const summaryRows = [
    [`${EVENT.name} · Corte de taquilla`],
    [day ? formatSaleDay(day) : 'Todo el evento'],
    [`Generado ${generated}`],
    [],
    ['Personas que entraron', stats.personas],
    ['Dinero recaudado', stats.total],
    ['Efectivo que debe haber en caja', stats.efectivo],
    ['Ventas', stats.ventas],
    ['Personas con cortesía', stats.cortesias],
    ['Ventas anuladas (no suman)', stats.anuladas],
    ['Monto anulado', stats.totalAnulado],
    [],
    ['Forma de pago', 'Ventas', 'Personas', 'Recaudado'],
    ...stats.byMethod.map((method) => [method.label, method.ventas, method.personas, method.total]),
    [],
    ['Tipo de entrada', 'Personas', 'Recaudado'],
    ...stats.byType.map((type) => [type.label, type.personas, type.total]),
    [],
    ['Caja', 'Ventas', 'Personas', 'Efectivo', 'Total'],
    ...stats.byCashier.map((row) => [row.label, row.ventas, row.personas, row.efectivo, row.total]),
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
  summarySheet['!cols'] = [34, 12, 12, 14, 14].map((wch) => ({ wch }));

  const header = [
    'Folio',
    'Día',
    'Hora',
    'Caja',
    'Detalle',
    'Personas',
    'Total',
    'Forma de pago',
    'Estado',
    'Motivo de anulación',
  ];
  const body = scoped.map((sale) => [
    sale.id ? saleFolio(sale.id) : 'Por subir',
    formatSaleDay(saleDayKey(sale.sold_at)),
    formatSaleTime(sale.sold_at),
    sale.cashier ?? '',
    describeItems(sale),
    sale.people,
    sale.total,
    paymentLabel(sale.payment_method),
    saleStatus(sale),
    sale.void_reason ?? '',
  ]);
  const salesSheet = XLSX.utils.aoa_to_sheet([header, ...body]);
  salesSheet['!cols'] = [9, 14, 8, 14, 38, 10, 12, 15, 11, 30].map((wch) => ({ wch }));
  salesSheet['!autofilter'] = {
    ref: XLSX.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: header.length - 1, r: body.length } }),
  };

  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, summarySheet, 'Corte');
  XLSX.utils.book_append_sheet(book, salesSheet, 'Ventas');

  const buffer = XLSX.write(book, { type: 'array', bookType: 'xlsx' });
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  triggerDownload(blob, `taquilla-${day || 'evento'}-${fileStamp()}.xlsx`);
}
