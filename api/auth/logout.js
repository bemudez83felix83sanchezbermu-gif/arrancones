import { json, withErrors } from '../../shared/db.js';
import { clearSessionCookie } from '../../shared/auth.js';

export default withErrors(async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Método no permitido' });
  }
  clearSessionCookie(req, res);
  return json(res, 200, { ok: true });
});
