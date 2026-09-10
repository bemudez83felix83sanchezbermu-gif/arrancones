import { withErrors } from '../../shared/db.js';

const send = (res, status, body, cache) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', cache);
  res.end(JSON.stringify(body));
};

/**
 * Lista pública del álbum. Usa el endpoint /resources/search de Cloudinary
 * para traer imágenes y videos en una sola llamada, filtrando fuera lo que
 * el admin ocultó (tag `hidden`).
 */
export default withErrors(async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return send(res, 405, { error: 'Método no permitido' }, 'no-store');
  }

  const cloudName = process.env.VITE_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return send(res, 500, { error: 'Cloudinary no está configurado' }, 'no-store');
  }

  const auth = 'Basic ' + Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
  const upstream = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/resources/search`,
    {
      method: 'POST',
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        expression: 'folder:carfest2k26/album AND -tags:hidden',
        max_results: 100,
        with_field: ['tags', 'context'],
        sort_by: [{ created_at: 'desc' }],
      }),
    },
  );

  if (!upstream.ok) {
    const detail = (await upstream.text()).slice(0, 400);
    return send(res, 502, { error: 'Cloudinary error', detail }, 'no-store');
  }

  const data = await upstream.json();
  const items = (data.resources || []).map((row) => ({
    id: row.public_id,
    url: row.secure_url,
    resourceType: row.resource_type || 'image',
    width: row.width,
    height: row.height,
    format: row.format,
    bytes: row.bytes,
    duration: row.duration || null,
    createdAt: row.created_at,
    uploader: row.context?.custom?.uploader || null,
  }));

  return send(res, 200, { photos: items }, 's-maxage=30, stale-while-revalidate=180');
});
