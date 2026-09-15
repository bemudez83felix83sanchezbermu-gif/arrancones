import { getSql, json, readBody, withErrors } from '../../shared/db.js';
import { getCurrentAdmin } from '../../shared/auth.js';
import { asSale, asTicketType, validateSale } from '../../shared/taquilla.js';

/**
 * Ventas de taquilla. Solo admins.
 * GET   → ventas (con sus renglones) + tipos de entrada, para el panel.
 * POST  → registra una venta. Idempotente por `client_id`: reintentar una venta
 *         guardada sin señal nunca la duplica.
 * PATCH → { id, action: 'void' | 'restore', reason } anula o restaura. Las ventas
 *         no se borran para que el corte de caja siempre se pueda reconstruir.
 */
export default withErrors(async (req, res) => {
  const admin = await getCurrentAdmin(req);
  if (!admin) return json(res, 401, { error: 'No autorizado' });

  const sql = getSql();

  if (req.method === 'GET') {
    const [sales, types] = await Promise.all([
      sql`select * from ticket_sales_full order by sold_at desc, id desc`,
      sql`select * from ticket_types order by sort_order, id`,
    ]);
    return json(res, 200, { sales: sales.map(asSale), types: types.map(asTicketType) });
  }

  if (req.method === 'POST') {
    const body = await readBody(req);
    const { ok, errors, value } = validateSale(body);
    if (!ok) return json(res, 422, { error: 'Revisa la venta', errors });

    // Reintento de una venta que ya llegó: se responde sin intentar insertar, para
    // no gastar un folio del identity (el `on conflict` de abajo cubre la carrera).
    const [already] = await sql`select * from ticket_sales_full where client_id = ${value.client_id}`;
    if (already) return json(res, 200, { sale: asSale(already), duplicate: true });

    // Si el tipo se borró mientras la venta esperaba señal, se guarda solo con su nombre.
    const typeIds = value.items.map((item) => item.ticket_type_id).filter(Boolean);
    const existing = typeIds.length
      ? await sql`select id from ticket_types where id = any(${typeIds}::bigint[])`
      : [];
    const known = new Set(existing.map((row) => Number(row.id)));
    const items = value.items.map((item) => ({
      ...item,
      ticket_type_id: known.has(item.ticket_type_id) ? item.ticket_type_id : null,
    }));

    // Venta y renglones en una sola sentencia: se guardan completos o no se guardan.
    const inserted = await sql`
      with sale as (
        insert into ticket_sales
          (client_id, payment_method, people, total, cashier, notes, sold_at, created_by)
        values
          (${value.client_id}, ${value.payment_method}, ${value.people}, ${value.total},
           ${value.cashier}, ${value.notes}, ${value.sold_at}, ${admin.id})
        on conflict (client_id) do nothing
        returning id
      ), lines as (
        insert into ticket_sale_items (sale_id, ticket_type_id, name, unit_price, quantity)
        select sale.id, x.ticket_type_id, x.name, x.unit_price, x.quantity
        from sale
        cross join jsonb_to_recordset(${JSON.stringify(items)}::jsonb)
          as x(ticket_type_id bigint, name text, unit_price numeric, quantity integer)
        returning sale_id
      )
      select id from sale
    `;

    const [sale] = await sql`select * from ticket_sales_full where client_id = ${value.client_id}`;
    return json(res, inserted.length ? 201 : 200, {
      sale: asSale(sale),
      duplicate: inserted.length === 0,
    });
  }

  if (req.method === 'PATCH') {
    const body = await readBody(req);
    const id = Number(body.id);
    if (!Number.isInteger(id) || id <= 0) return json(res, 400, { error: 'Venta inválida' });

    const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 200) : '';
    let updated;
    if (body.action === 'void') {
      [updated] = await sql`
        update ticket_sales set
          voided_at   = coalesce(voided_at, now()),
          voided_by   = coalesce(voided_by, ${admin.id}),
          void_reason = ${reason || null}
        where id = ${id}
        returning id
      `;
    } else if (body.action === 'restore') {
      [updated] = await sql`
        update ticket_sales set voided_at = null, voided_by = null, void_reason = null
        where id = ${id}
        returning id
      `;
    } else {
      return json(res, 400, { error: 'Acción no soportada (void|restore)' });
    }
    if (!updated) return json(res, 404, { error: 'Esa venta ya no existe' });

    const [sale] = await sql`select * from ticket_sales_full where id = ${id}`;
    return json(res, 200, { sale: asSale(sale) });
  }

  res.setHeader('Allow', 'GET, POST, PATCH');
  return json(res, 405, { error: 'Método no permitido' });
});
