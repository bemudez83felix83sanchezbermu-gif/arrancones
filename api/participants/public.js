import { getSql, withErrors } from '../../shared/db.js';

const send = (res, status, body, cache) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', cache);
  res.end(JSON.stringify(body));
};

/**
 * Endpoint público (sin autenticación) que alimenta la sección "Competidores"
 * del landing. Solo devuelve datos que aceptamos publicar y los registros que
 * ya tengan foto del vehículo (los "confirmados" visualmente).
 */
export default withErrors(async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return send(res, 405, { error: 'Método no permitido' }, 'no-store');
  }

  const sql = getSql();
  const rows = await sql`
    select id, pilot_name, vehicle_name, category, race_class, vehicle_photo, social, created_at
    from participants
    where vehicle_photo is not null
      and status <> 'cancelado'
    order by created_at desc, id desc
    limit 60
  `;

  return send(
    res,
    200,
    {
      participants: rows.map((row) => ({
        id: Number(row.id),
        pilot_name: row.pilot_name,
        vehicle_name: row.vehicle_name,
        category: row.category,
        race_class: row.race_class,
        vehicle_photo: row.vehicle_photo,
        social: row.social,
      })),
    },
    's-maxage=60, stale-while-revalidate=300',
  );
});
