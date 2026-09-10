import { json, readBody, withErrors } from '../../shared/db.js';
import { getCurrentAdmin } from '../../shared/auth.js';

/**
 * Moderación del álbum. Cloudinary sigue como fuente de verdad:
 * "ocultar" es un tag `hidden` en el recurso (reversible); "eliminar" es
 * destroy definitivo. Soporta tanto imágenes como videos.
 */

const HIDDEN_TAG = 'hidden';
const FOLDER = 'carfest2k26/album';

function cloudinaryCreds() {
  const cloudName = process.env.VITE_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary no está configurado (faltan API key/secret o cloud name).');
  }
  const auth = 'Basic ' + Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
  return { cloudName, auth };
}

async function listAll(cloudName, auth) {
  const upstream = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/resources/search`,
    {
      method: 'POST',
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        expression: `folder:${FOLDER}`,
        max_results: 200,
        with_field: ['tags', 'context'],
        sort_by: [{ created_at: 'desc' }],
      }),
    },
  );
  if (!upstream.ok) {
    const detail = (await upstream.text()).slice(0, 400);
    throw new Error(`Cloudinary search falló (${upstream.status}): ${detail}`);
  }
  const data = await upstream.json();
  return (data.resources || []).map((row) => ({
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
    tags: row.tags || [],
    hidden: (row.tags || []).includes(HIDDEN_TAG),
  }));
}

/** Cloudinary requiere el `resource_type` en la URL para tag ops y destroy. */
function tagUrl(cloudName, tag, resourceType) {
  return `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/tags/${encodeURIComponent(tag)}`;
}

async function toggleTag(cloudName, auth, publicId, tag, resourceType, command) {
  const form = new URLSearchParams({ public_ids: publicId, command });
  const upstream = await fetch(tagUrl(cloudName, tag, resourceType), {
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
  });
  if (!upstream.ok) {
    const detail = (await upstream.text()).slice(0, 400);
    throw new Error(`Cloudinary ${command} tag falló (${upstream.status}): ${detail}`);
  }
}

async function destroy(cloudName, auth, publicId, resourceType) {
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/resources/${resourceType}/upload`;
  const form = new URLSearchParams({ 'public_ids[]': publicId });
  const upstream = await fetch(`${url}?${form.toString()}`, {
    method: 'DELETE',
    headers: { Authorization: auth },
  });
  if (!upstream.ok) {
    const detail = (await upstream.text()).slice(0, 400);
    throw new Error(`Cloudinary destroy falló (${upstream.status}): ${detail}`);
  }
}

function normalizeResourceType(value) {
  return value === 'video' ? 'video' : 'image';
}

export default withErrors(async (req, res) => {
  const admin = await getCurrentAdmin(req);
  if (!admin) return json(res, 401, { error: 'No autorizado' });

  const { cloudName, auth } = cloudinaryCreds();

  if (req.method === 'GET') {
    const photos = await listAll(cloudName, auth);
    return json(res, 200, { photos });
  }

  if (req.method === 'POST') {
    const body = await readBody(req);
    const publicId = String(body.publicId || '').trim();
    const action = String(body.action || '').trim();
    const resourceType = normalizeResourceType(body.resourceType);
    if (!publicId) return json(res, 400, { error: 'Falta publicId' });
    if (!publicId.startsWith(`${FOLDER}/`)) {
      return json(res, 400, { error: 'publicId fuera de la carpeta del álbum' });
    }

    if (action === 'hide') {
      await toggleTag(cloudName, auth, publicId, HIDDEN_TAG, resourceType, 'add');
      return json(res, 200, { ok: true, publicId, hidden: true });
    }
    if (action === 'unhide') {
      await toggleTag(cloudName, auth, publicId, HIDDEN_TAG, resourceType, 'remove');
      return json(res, 200, { ok: true, publicId, hidden: false });
    }
    return json(res, 400, { error: 'Acción no soportada (hide|unhide)' });
  }

  if (req.method === 'DELETE') {
    const body = await readBody(req);
    const publicId = String(body.publicId || '').trim();
    const resourceType = normalizeResourceType(body.resourceType);
    if (!publicId) return json(res, 400, { error: 'Falta publicId' });
    if (!publicId.startsWith(`${FOLDER}/`)) {
      return json(res, 400, { error: 'publicId fuera de la carpeta del álbum' });
    }
    await destroy(cloudName, auth, publicId, resourceType);
    return json(res, 200, { ok: true, deleted: publicId });
  }

  res.setHeader('Allow', 'GET, POST, DELETE');
  return json(res, 405, { error: 'Método no permitido' });
});
