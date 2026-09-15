import { getSql, json, readBody, withErrors } from '../../shared/db.js';
import { getCurrentAdmin } from '../../shared/auth.js';
import { asTicketType, validateTicketType } from '../../shared/taquilla.js';

/**
 * Tipos de entrada de la taquilla (nombre, precio, activo y orden). Solo admins.
 * Una entrada con ventas no se borra: se desactiva para que deje de ofrecerse.
 */
export default withErrors(async (req, res) => {
  const admin = await getCurrentAdmin(req);
  if (!admin) return json(res, 401, { error: 'No autorizado' });

  const sql = getSql();

  if (req.method === 'GET') {
    const rows = await sql`select * from ticket_types order by sort_order, id`;
    return json(res, 200, { types: rows.map(asTicketType) });
  }

  if (req.method === 'POST') {
    const body = await readBody(req);
    const { ok, errors, value } = validateTicketType(body);
    if (!ok) return json(res, 422, { error: 'Revisa los datos de la entrada', errors });

    const [duplicate] = await sql`
      select id from ticket_types where lower(name) = lower(${value.name}) limit 1
    `;
    if (duplicate) return json(res, 409, { error: 'Ya existe una entrada con ese nombre.' });

    const [{ next }] = await sql`
      select coalesce(max(sort_order), 0) + 1 as next from ticket_types
    `;
    const [row] = await sql`
      insert into ticket_types (name, price, active, sort_order)
      values (${value.name}, ${value.price}, ${value.active ?? true}, ${value.sort_order ?? Number(next)})
      returning *
    `;
    return json(res, 201, { type: asTicketType(row) });
  }

  const body = await readBody(req);
  const id = Number(body.id);
  if (!Number.isInteger(id) || id <= 0) return json(res, 400, { error: 'Entrada inválida' });

  const [current] = await sql`select * from ticket_types where id = ${id}`;
  if (!current) return json(res, 404, { error: 'Esa entrada ya no existe' });

  if (req.method === 'PATCH') {
    const { ok, errors, value } = validateTicketType(body, { partial: true });
    if (!ok) return json(res, 422, { error: 'Revisa los datos de la entrada', errors });

    if (value.name) {
      const [duplicate] = await sql`
        select id from ticket_types
        where lower(name) = lower(${value.name}) and id <> ${id}
        limit 1
      `;
      if (duplicate) return json(res, 409, { error: 'Ya existe una entrada con ese nombre.' });
    }

    const [row] = await sql`
      update ticket_types set
        name       = ${value.name ?? current.name},
        price      = ${value.price ?? current.price},
        active     = ${value.active ?? current.active},
        sort_order = ${value.sort_order ?? current.sort_order},
        updated_at = now()
      where id = ${id}
      returning *
    `;
    return json(res, 200, { type: asTicketType(row) });
  }

  if (req.method === 'DELETE') {
    const [used] = await sql`
      select 1 from ticket_sale_items where ticket_type_id = ${id} limit 1
    `;
    if (used) {
      return json(res, 409, {
        error: 'Esta entrada ya tiene ventas. Desactívala para que deje de aparecer en la taquilla.',
      });
    }
    await sql`delete from ticket_types where id = ${id}`;
    return json(res, 200, { deleted: id });
  }

  res.setHeader('Allow', 'GET, POST, PATCH, DELETE');
  return json(res, 405, { error: 'Método no permitido' });
});
