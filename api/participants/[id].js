import { asParticipant, getSql, json, readBody, withErrors } from '../../shared/db.js';
import { getCurrentAdmin } from '../../shared/auth.js';
import { validateParticipant } from '../../shared/participants.js';

const EDITABLE = [
  'pilot_name',
  'copilot_name',
  'category',
  'vehicle_name',
  'phone',
  'state',
  'city',
  'social',
  'status',
  'notes',
];

export default withErrors(async (req, res) => {
  const admin = await getCurrentAdmin(req);
  if (!admin) return json(res, 401, { error: 'No autorizado' });

  const sql = getSql();
  const id = Number(req.query?.id);
  if (!Number.isInteger(id) || id <= 0) return json(res, 400, { error: 'Folio inválido' });

  const [current] = await sql`select * from participants where id = ${id}`;
  if (!current) return json(res, 404, { error: 'Ese registro ya no existe' });

  if (req.method === 'GET') return json(res, 200, { participant: asParticipant(current) });

  if (req.method === 'PATCH' || req.method === 'PUT') {
    const body = await readBody(req);
    const patch = {};
    for (const key of EDITABLE) if (key in body) patch[key] = body[key];
    if (!Object.keys(patch).length) return json(res, 400, { error: 'Nada que actualizar' });

    // Se valida sobre la fila completa para que las reglas por categoría
    // (arrancones sin copiloto) se apliquen aunque solo cambie un campo.
    const merged = { ...current, ...patch };
    const { ok, errors, value } = validateParticipant(merged);
    if (!ok) return json(res, 422, { error: 'Revisa los datos', errors });

    const [participant] = await sql`
      update participants set
        pilot_name   = ${value.pilot_name},
        copilot_name = ${value.copilot_name},
        category     = ${value.category},
        vehicle_name = ${value.vehicle_name},
        phone        = ${value.phone},
        state        = ${value.state},
        city         = ${value.city},
        social       = ${value.social},
        status       = ${value.status},
        notes        = ${value.notes},
        updated_at   = now()
      where id = ${id}
      returning *
    `;
    return json(res, 200, { participant: asParticipant(participant) });
  }

  if (req.method === 'DELETE') {
    await sql`delete from participants where id = ${id}`;
    return json(res, 200, { deleted: id });
  }

  res.setHeader('Allow', 'GET, PATCH, DELETE');
  return json(res, 405, { error: 'Método no permitido' });
});
