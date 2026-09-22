import { getSql, withErrors } from '../../shared/db.js';

const DATA_URL = /^data:(image\/(?:webp|jpeg|png));base64,(.+)$/;

const fail = (res, status, message) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(message);
};

/**
 * Miniatura pública del vehículo como imagen real (no base64 en JSON), para
 * que el navegador y la CDN de Vercel la guarden. `/api/participants/public`
 * arma la URL con `?v=<updated_at>`, así que cada versión es inmutable.
 * Si el registro todavía no tiene miniatura se sirve la foto completa.
 */
export default withErrors(async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return fail(res, 405, 'Método no permitido');
  }

  const id = Number(req.query?.id);
  if (!Number.isInteger(id) || id <= 0) return fail(res, 400, 'Folio inválido');

  const sql = getSql();
  const [row] = await sql`
    select coalesce(vehicle_thumb, vehicle_photo) as photo
    from participants
    where id = ${id}
      and vehicle_photo is not null
      and status <> 'cancelado'
  `;
  const match = DATA_URL.exec(row?.photo ?? '');
  if (!match) return fail(res, 404, 'Sin foto');

  const body = Buffer.from(match[2], 'base64');
  res.statusCode = 200;
  res.setHeader('Content-Type', match[1]);
  res.setHeader('Content-Length', body.length);
  res.setHeader('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable');
  res.end(body);
});
