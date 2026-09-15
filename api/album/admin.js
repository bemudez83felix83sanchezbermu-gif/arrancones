import { createHash } from 'node:crypto';
import { json, readBody, withErrors } from '../../shared/db.js';
import { getCurrentAdmin } from '../../shared/auth.js';
import {
  ALBUM_FOLDER,
  ALBUM_CATEGORIES,
  MAX_MODERATION_BATCH,
  UPLOADER_MAX,
  isAlbumPublicId,
  readAlbumContext,
  toCloudinaryContext,
} from '../../shared/album.js';

/**
 * Moderación previa del álbum. El preset `carfest_album` sube con
 * `moderation: manual`, así que todo nace `pending` y el álbum público solo lista
 * `approved`. Cloudinary sigue como fuente única: aprobar/rechazar cambia
 * `moderation_status`, cambiar categoría reescribe el `context`, borrar es destroy
 * y "mandar a revisión" mete a la cola manual lo que se subió sin moderación.
 */

const STATUS_ACTIONS = { approve: 'approved', reject: 'rejected' };
const CONCURRENCY = 5;

function cloudinaryCreds() {
  const cloudName = process.env.VITE_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary no está configurado (faltan API key/secret o cloud name).');
  }
  const auth = 'Basic ' + Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
  return { cloudName, apiKey, apiSecret, auth };
}

async function cloudinaryError(upstream, what) {
  const text = (await upstream.text()).slice(0, 400);
  let message = text;
  try {
    message = JSON.parse(text)?.error?.message || text;
  } catch {
    // no era JSON
  }
  return new Error(`${what} (${upstream.status}): ${message}`);
}

function readRateLimit(headers) {
  const limit = Number(headers.get('x-featureratelimit-limit'));
  const remaining = Number(headers.get('x-featureratelimit-remaining'));
  if (!Number.isFinite(limit) || !Number.isFinite(remaining) || limit <= 0) return null;
  return { limit, remaining, reset: headers.get('x-featureratelimit-reset') };
}

async function search(cloudName, auth, expression) {
  const upstream = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/resources/search`, {
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      expression,
      max_results: 500,
      with_field: ['context'],
      sort_by: [{ created_at: 'desc' }],
    }),
  });
  if (!upstream.ok) throw await cloudinaryError(upstream, 'Cloudinary search falló');
  const data = await upstream.json();
  return { resources: data.resources || [], rateLimit: readRateLimit(upstream.headers) };
}

/**
 * El Search API filtra por `moderation_status` pero no lo devuelve en cada recurso,
 * así que se cruza la carpeta completa con una búsqueda por estado.
 */
async function listAll(cloudName, auth) {
  const base = `folder:${ALBUM_FOLDER}`;
  const [all, pending, approved, rejected] = await Promise.all([
    search(cloudName, auth, base),
    search(cloudName, auth, `${base} AND moderation_status:pending`),
    search(cloudName, auth, `${base} AND moderation_status:approved`),
    search(cloudName, auth, `${base} AND moderation_status:rejected`),
  ]);
  const idsOf = (result) => new Set(result.resources.map((row) => row.public_id));
  const sets = { pending: idsOf(pending), approved: idsOf(approved), rejected: idsOf(rejected) };

  const photos = all.resources.map((row) => {
    const { uploader, category } = readAlbumContext(row);
    const status =
      Object.keys(sets).find((key) => sets[key].has(row.public_id)) ?? 'unmoderated';
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
      status,
    };
  });

  const limits = [all, pending, approved, rejected].map((r) => r.rateLimit).filter(Boolean);
  const rateLimit = limits.length
    ? limits.reduce((min, r) => (r.remaining < min.remaining ? r : min))
    : null;
  return { photos, rateLimit };
}

const assetPath = (publicId) => publicId.split('/').map(encodeURIComponent).join('/');

async function updateResource(cloudName, auth, item, params) {
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/resources/${item.resourceType}/upload/${assetPath(item.publicId)}`;
  const upstream = await fetch(url, {
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params),
  });
  if (!upstream.ok) throw await cloudinaryError(upstream, 'Cloudinary update falló');
}

/** Firma del Upload API: parámetros ordenados como `k=v&k=v`, más el secret, en SHA-1. */
export function signParams(params, apiSecret) {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  return createHash('sha1').update(payload + apiSecret).digest('hex');
}

/**
 * Un archivo que nació sin moderación no acepta `moderation_status` por update.
 * `explicit` (Upload API, firmado) sí lo mete a la cola manual y queda `pending`;
 * además no gasta cuota del Admin API.
 */
async function sendToReview({ cloudName, apiKey, apiSecret }, item) {
  const params = {
    moderation: 'manual',
    public_id: item.publicId,
    timestamp: Math.floor(Date.now() / 1000),
    type: 'upload',
  };
  const upstream = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${item.resourceType}/explicit`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ ...params, api_key: apiKey, signature: signParams(params, apiSecret) }),
    },
  );
  if (!upstream.ok) throw await cloudinaryError(upstream, 'Cloudinary explicit falló');
}

async function destroy(cloudName, auth, publicId, resourceType) {
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/resources/${resourceType}/upload`;
  const form = new URLSearchParams({ 'public_ids[]': publicId });
  const upstream = await fetch(`${url}?${form.toString()}`, {
    method: 'DELETE',
    headers: { Authorization: auth },
  });
  if (!upstream.ok) throw await cloudinaryError(upstream, 'Cloudinary destroy falló');
}

/** Corre `task` sobre cada item con concurrencia limitada; reporta éxitos y fallos por separado. */
async function runBatch(items, task) {
  const done = [];
  const failed = [];
  let cursor = 0;
  const worker = async () => {
    while (cursor < items.length) {
      const item = items[cursor++];
      try {
        await task(item);
        done.push(item.publicId);
      } catch (err) {
        failed.push({ publicId: item.publicId, error: String(err.message ?? err) });
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, worker));
  return { done, failed };
}

function parseItems(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return { error: 'Faltan archivos (items)' };
  if (raw.length > MAX_MODERATION_BATCH) {
    return { error: `Máximo ${MAX_MODERATION_BATCH} archivos por petición` };
  }
  const items = [];
  for (const entry of raw) {
    const publicId = String(entry?.publicId || '').trim();
    if (!isAlbumPublicId(publicId)) return { error: 'publicId fuera de la carpeta del álbum' };
    items.push({
      publicId,
      resourceType: entry?.resourceType === 'video' ? 'video' : 'image',
      uploader: String(entry?.uploader || '').trim().slice(0, UPLOADER_MAX),
    });
  }
  return { items };
}

export default withErrors(async (req, res) => {
  const admin = await getCurrentAdmin(req);
  if (!admin) return json(res, 401, { error: 'No autorizado' });

  const creds = cloudinaryCreds();
  const { cloudName, auth } = creds;

  if (req.method === 'GET') {
    return json(res, 200, await listAll(cloudName, auth));
  }

  if (req.method === 'POST') {
    const body = await readBody(req);
    const action = String(body.action || '').trim();
    const { items, error } = parseItems(body.items);
    if (error) return json(res, 400, { error });

    if (STATUS_ACTIONS[action]) {
      const status = STATUS_ACTIONS[action];
      const result = await runBatch(items, (item) =>
        updateResource(cloudName, auth, item, { moderation_status: status }),
      );
      return json(res, 200, { status, ...result });
    }

    if (action === 'review') {
      const result = await runBatch(items, (item) => sendToReview(creds, item));
      return json(res, 200, { status: 'pending', ...result });
    }

    if (action === 'category') {
      const category = String(body.category || '');
      if (!ALBUM_CATEGORIES[category]) return json(res, 400, { error: 'Categoría no válida' });
      // `context` en update reemplaza todo el contexto: se reenvía el uploader.
      const result = await runBatch(items, (item) =>
        updateResource(cloudName, auth, item, {
          context: toCloudinaryContext({ uploader: item.uploader, category }),
        }),
      );
      return json(res, 200, { category, ...result });
    }

    return json(res, 400, { error: 'Acción no soportada (approve|reject|review|category)' });
  }

  if (req.method === 'DELETE') {
    const body = await readBody(req);
    const publicId = String(body.publicId || '').trim();
    const resourceType = body.resourceType === 'video' ? 'video' : 'image';
    if (!isAlbumPublicId(publicId)) {
      return json(res, 400, { error: 'publicId fuera de la carpeta del álbum' });
    }
    await destroy(cloudName, auth, publicId, resourceType);
    return json(res, 200, { ok: true, deleted: publicId });
  }

  res.setHeader('Allow', 'GET, POST, DELETE');
  return json(res, 405, { error: 'Método no permitido' });
});
