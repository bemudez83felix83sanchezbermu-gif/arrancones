import { asParticipant, getSql, json, readBody, withErrors } from '../../shared/db.js';
import { getCurrentAdmin } from '../../shared/auth.js';
import { validateParticipant } from '../../shared/participants.js';

export default withErrors(async (req, res) => {
  const sql = getSql();

  if (req.method === 'GET') {
    const admin = await getCurrentAdmin(req);
    if (!admin) return json(res, 401, { error: 'No autorizado' });
    const participants = await sql`
      select * from participants
      order by created_at desc, id desc
    `;
    return json(res, 200, { participants: participants.map(asParticipant) });
  }

  if (req.method === 'POST') {
    const body = await readBody(req);
    // El estado nunca lo decide el formulario público.
    const { ok, errors, value } = validateParticipant({
      category: body.category,
      pilot_name: body.pilot_name,
      copilot_name: body.copilot_name ?? '',
      vehicle_name: body.vehicle_name,
      phone: body.phone,
      state: body.state,
      city: body.city,
      social: body.social ?? '',
    });
    if (!ok) return json(res, 422, { error: 'Revisa los datos del formulario', errors });

    const [duplicate] = await sql`
      select id from participants
      where lower(pilot_name) = lower(${value.pilot_name})
        and lower(vehicle_name) = lower(${value.vehicle_name})
        and category = ${value.category}
      limit 1
    `;
    if (duplicate) {
      return json(res, 409, {
        error: 'Ese piloto ya está registrado con ese vehículo en esa categoría.',
      });
    }

    const [participant] = await sql`
      insert into participants
        (pilot_name, copilot_name, category, vehicle_name, phone, state, city, social, status)
      values
        (${value.pilot_name}, ${value.copilot_name}, ${value.category}, ${value.vehicle_name},
         ${value.phone}, ${value.state}, ${value.city}, ${value.social}, 'pendiente')
      returning *
    `;
    return json(res, 201, { participant: asParticipant(participant) });
  }

  res.setHeader('Allow', 'GET, POST');
  return json(res, 405, { error: 'Método no permitido' });
});
