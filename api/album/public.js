import { withErrors } from '../../shared/db.js';
import { ALBUM_FOLDER, readAlbumContext } from '../../shared/album.js';

const send = (res, status, body, cache) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', cache);
  res.end(JSON.stringify(body));
};

/**
 * Lista pública del álbum. Solo sale lo que un admin aprobó: el preset sube todo
 * con `moderation: manual` y `moderation_status` solo cambia con el Admin API, así
 * que quien sube por el preset unsigned no puede auto-publicarse. Si el preset
 * perdiera la moderación, lo nuevo simplemente no aparece (falla cerrado).
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
        expression: `folder:${ALBUM_FOLDER} AND moderation_status:approved`,
        max_results: 500,
        with_field: ['context'],
        sort_by: [{ created_at: 'desc' }],
      }),
    },
  );

  if (!upstream.ok) {
    const detail = (await upstream.text()).slice(0, 400);
    return send(res, 502, { error: 'Cloudinary error', detail }, 'no-store');
  }

  const data = await upstream.json();
  const items = (data.resources || []).map((row) => {
    const { uploader, category } = readAlbumContext(row);
    return {
      id: row.public_id,
      url: row.secure_url,
      resourceType: row.resource_type || 'image',
      width: row.width,
      height: row.height,
      format: row.format,
      bytes: row.bytes,
      duration: row.duration || null,
      createdAt: row.created_at,
      uploader,
      category,
    };
  });

  // 60 s de edge: cada miss es una llamada al Admin API (500/h en el plan Free).
  return send(res, 200, { photos: items }, 's-maxage=60, stale-while-revalidate=300');
});
