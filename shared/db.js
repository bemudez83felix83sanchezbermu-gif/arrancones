import { neon } from '@neondatabase/serverless';

let cached = null;

/** Conexión Neon. Acepta cualquiera de los nombres que crea la integración de Vercel. */
export function getSql() {
  if (cached) return cached;
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING;
  if (!url) {
    throw new Error(
      'Falta DATABASE_URL. En local corre: vercel env pull .env.local --environment=production',
    );
  }
  cached = neon(url);
  return cached;
}

/** El driver devuelve bigint como texto; el id se usa como número en todo el panel. */
export const asParticipant = (row) => (row ? { ...row, id: Number(row.id) } : row);

export const asAdmin = (row) => (row ? { ...row, id: Number(row.id) } : row);

export const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
};

/** Body JSON, ya sea que el runtime lo haya parseado o llegue como stream. */
export async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return {};
  }
}

/** Envuelve un handler para que ningún error se escape como 500 mudo. */
export const withErrors = (handler) => async (req, res) => {
  try {
    await handler(req, res);
  } catch (err) {
    console.error('[api]', req.method, req.url, err);
    json(res, 500, { error: 'Error del servidor', detail: String(err.message ?? err) });
  }
};
