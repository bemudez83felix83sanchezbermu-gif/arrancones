import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Resuelve una ruta /api/... al archivo que la atiende, con el mismo
 * criterio que usa Vercel: archivo exacto, index.js de carpeta o [param].js.
 */
function resolveHandler(segments, dir, params = {}) {
  if (!fs.existsSync(dir)) return null;
  const [head, ...rest] = segments;

  if (!head) {
    const index = path.join(dir, 'index.js');
    return fs.existsSync(index) ? { file: index, params } : null;
  }

  const exact = path.join(dir, `${head}.js`);
  if (!rest.length && fs.existsSync(exact)) return { file: exact, params };

  const child = path.join(dir, head);
  if (fs.existsSync(child) && fs.statSync(child).isDirectory())
    return resolveHandler(rest, child, params);

  const dynamic = fs.readdirSync(dir).find((f) => /^\[.+\]\.js$/.test(f));
  if (dynamic && !rest.length) {
    const key = dynamic.slice(1, dynamic.indexOf(']'));
    return { file: path.join(dir, dynamic), params: { ...params, [key]: head } };
  }
  return null;
}

/** Copia las variables de los archivos .env a process.env, que es lo que leen las funciones. */
function loadIntoProcessEnv(mode) {
  const env = loadEnv(mode, process.cwd(), '');
  for (const [key, value] of Object.entries(env)) {
    if (value && process.env[key] !== value) process.env[key] = value;
  }
}

/** Ejecuta las funciones serverless de /api durante `npm run dev`. */
function devApi(mode) {
  const apiDir = path.resolve(process.cwd(), 'api');
  return {
    name: 'dev-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next();
        const url = new URL(req.url, 'http://localhost');
        const segments = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);
        const match = resolveHandler(segments, apiDir);
        if (!match) return next();

        // Si pegaste la conexión con el servidor ya arrancado, se recarga sola.
        if (!process.env.DATABASE_URL) loadIntoProcessEnv(mode);

        req.query = { ...Object.fromEntries(url.searchParams), ...match.params };
        try {
          const mod = await server.ssrLoadModule(match.file);
          await mod.default(req, res);
        } catch (err) {
          server.ssrFixStacktrace?.(err);
          console.error('[dev-api]', req.method, req.url, err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ error: 'Error del servidor', detail: String(err.message ?? err) }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Las funciones de /api leen process.env, no import.meta.env.
  loadIntoProcessEnv(mode);
  return {
    plugins: [react(), devApi(mode)],
    server: { port: Number(process.env.PORT) || 5173 },
  };
});
