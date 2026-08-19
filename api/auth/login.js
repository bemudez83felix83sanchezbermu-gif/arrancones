import { asAdmin, getSql, json, readBody, withErrors } from '../../shared/db.js';
import {
  setSessionCookie,
  signSession,
  verifyPassword,
} from '../../shared/auth.js';

const GENERIC_ERROR = 'Usuario o contraseña incorrectos';

export default withErrors(async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Método no permitido' });
  }

  const body = await readBody(req);
  const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!username || !password) {
    return json(res, 400, { error: 'Ingresa usuario y contraseña' });
  }

  const sql = getSql();
  const [row] = await sql`
    select id, username, password_hash, created_at, last_login_at
    from admins where lower(username) = ${username}
    limit 1
  `;

  if (!row || !verifyPassword(password, row.password_hash)) {
    return json(res, 401, { error: GENERIC_ERROR });
  }

  const admin = asAdmin(row);
  const token = signSession(admin.id);
  setSessionCookie(req, res, token);

  await sql`update admins set last_login_at = now() where id = ${admin.id}`;

  return json(res, 200, {
    admin: {
      id: admin.id,
      username: admin.username,
      created_at: admin.created_at,
      last_login_at: new Date().toISOString(),
    },
  });
});
