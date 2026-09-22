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
 *
 * La foto no viaja aquí: va como `photo_url` hacia `/api/participants/photo`,
 * que sirve la miniatura con caché de CDN. Antes el JSON traía las fotos en
 * base64 y pesaba ~6 MB con 28 inscritos.
 */
export default withErrors(async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return send(res, 405, { error: 'Método no permitido' }, 'no-store');
  }

  const sql = getSql();
  const rows = await sql`
    select id, pilot_name, vehicle_name, category, race_class, social, created_at, updated_at,
           vehicle_thumb is not null as has_thumb
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
        // `v` cambia con cada edición y cuando llega la miniatura, así la URL se
        // puede cachear para siempre.
        photo_url: `/api/participants/photo?id=${row.id}&v=${new Date(row.updated_at).getTime()}${
          row.has_thumb ? 't' : ''
        }`,
        social: row.social,
      })),
    },
    's-maxage=60, stale-while-revalidate=300',
  );
});
