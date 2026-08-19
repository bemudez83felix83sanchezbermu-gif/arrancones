import { json, withErrors } from '../../shared/db.js';
import { getCurrentAdmin } from '../../shared/auth.js';

export default withErrors(async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return json(res, 405, { error: 'Método no permitido' });
  }

  const admin = await getCurrentAdmin(req);
  if (!admin) return json(res, 401, { error: 'No autorizado' });
  return json(res, 200, { admin });
});
